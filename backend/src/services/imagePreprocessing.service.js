import sharp from "sharp";
import { performance } from "node:perf_hooks";

const OCR_MAX_EDGE = 2200;

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function weightedScore(parts) {
  const usableParts = parts.filter((part) => Number.isFinite(part.value) && Number.isFinite(part.weight) && part.weight > 0);

  if (!usableParts.length) {
    return 0;
  }

  const totalWeight = usableParts.reduce((sum, part) => sum + part.weight, 0);
  const score = usableParts.reduce((sum, part) => sum + part.value * part.weight, 0) / totalWeight;

  return clampScore(score);
}

function orientationToRotation(orientation) {
  if ([5, 6].includes(orientation)) {
    return 90;
  }

  if ([3, 4].includes(orientation)) {
    return 180;
  }

  if ([7, 8].includes(orientation)) {
    return 270;
  }

  return 0;
}

function scoreResolution(width, height) {
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);

  if (shortSide >= 1200 && longSide >= 1700) {
    return 96;
  }

  if (shortSide >= 900 && longSide >= 1300) {
    return 88;
  }

  if (shortSide >= 650 && longSide >= 950) {
    return 74;
  }

  if (shortSide >= 450 && longSide >= 700) {
    return 56;
  }

  return 34;
}

function scoreBlur(laplacianVariance) {
  if (laplacianVariance >= 1400) {
    return 96;
  }

  if (laplacianVariance >= 750) {
    return 86;
  }

  if (laplacianVariance >= 360) {
    return 70;
  }

  if (laplacianVariance >= 170) {
    return 48;
  }

  return 24;
}

function scoreCrop(trimInfo, width, height) {
  if (!trimInfo?.trimOffsetLeft && !trimInfo?.trimOffsetTop && !trimInfo?.width && !trimInfo?.height) {
    return 70;
  }

  const croppedWidth = trimInfo.width || width;
  const croppedHeight = trimInfo.height || height;
  const areaRatio = (croppedWidth * croppedHeight) / Math.max(width * height, 1);
  const leftMargin = trimInfo.trimOffsetLeft ?? 0;
  const topMargin = trimInfo.trimOffsetTop ?? 0;
  const rightMargin = Math.max(width - croppedWidth - leftMargin, 0);
  const bottomMargin = Math.max(height - croppedHeight - topMargin, 0);
  const touchesEdge = [leftMargin, topMargin, rightMargin, bottomMargin].some((margin) => margin <= 4);
  const marginPenalty = touchesEdge && areaRatio < 0.9 ? 12 : 0;

  if (areaRatio >= 0.9 && areaRatio <= 1.01) {
    return touchesEdge ? 88 : 94;
  }

  if (areaRatio >= 0.72 && areaRatio <= 0.98) {
    return clampScore(92 - marginPenalty);
  }

  if (areaRatio >= 0.55) {
    return clampScore(74 - marginPenalty);
  }

  return clampScore(48 - marginPenalty);
}

function scoreBrightness(mean) {
  if (!Number.isFinite(mean)) {
    return 65;
  }

  if (mean >= 90 && mean <= 205) {
    return 92;
  }

  if (mean >= 65 && mean <= 225) {
    return 74;
  }

  return 48;
}

async function calculateBlurVariance(buffer) {
  const sample = await sharp(buffer).rotate().resize({ width: 420, withoutEnlargement: true }).greyscale().raw().toBuffer({
    resolveWithObject: true
  });
  const { data, info } = sample;
  const values = [];

  if (info.width < 3 || info.height < 3) {
    return 0;
  }

  for (let y = 1; y < info.height - 1; y += 1) {
    for (let x = 1; x < info.width - 1; x += 1) {
      const index = y * info.width + x;
      const center = data[index] * 4;
      const laplacian = center - data[index - 1] - data[index + 1] - data[index - info.width] - data[index + info.width];
      values.push(laplacian);
    }
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function buildWarnings({ blurScore, cropQuality, resolutionScore, brightnessScore, rotationDetected }) {
  const warnings = [];

  if (blurScore < 50) {
    warnings.push("Image quality is too low for reliable MRZ extraction.");
  } else if (blurScore < 70) {
    warnings.push("Image appears slightly blurry. MRZ characters may be misread.");
  }

  if (cropQuality < 52) {
    warnings.push("Passport appears partially cropped or not fully visible.");
  }

  if (resolutionScore < 60) {
    warnings.push("Image resolution is low. Retake closer with the full passport page visible.");
  }

  if (brightnessScore < 60) {
    warnings.push("Lighting appears poor. Improve lighting and avoid glare/reflections.");
  }

  if (rotationDetected) {
    warnings.push("Passport image rotation was detected and corrected before OCR.");
  }

  return warnings;
}

function buildSuggestedActions({ blurScore, cropQuality, resolutionScore, brightnessScore, rotationDetected }) {
  const actions = new Set();

  if (blurScore < 70) {
    actions.add("Retake image");
    actions.add("Capture passport straight-on");
  }

  if (brightnessScore < 70) {
    actions.add("Improve lighting");
    actions.add("Avoid glare/reflections");
  }

  if (cropQuality < 60 || rotationDetected) {
    actions.add("Keep MRZ fully visible");
    actions.add("Capture passport straight-on");
  }

  if (resolutionScore < 70) {
    actions.add("Move closer while keeping the full passport page visible");
  }

  if (!actions.size) {
    actions.add("Keep MRZ fully visible");
    actions.add("Avoid glare/reflections");
    actions.add("Capture passport straight-on");
  }

  return [...actions];
}

export async function preprocessPassportImage(imageBuffer) {
  const startedAt = performance.now();
  const timings = {};
  let stageStartedAt = startedAt;
  const original = sharp(imageBuffer, { limitInputPixels: 30_000_000 });
  const metadata = await original.metadata();
  timings.metadataMs = Math.round(performance.now() - stageStartedAt);
  stageStartedAt = performance.now();
  const rotationApplied = orientationToRotation(metadata.orientation);
  const normalized = await sharp(imageBuffer, { limitInputPixels: 30_000_000 })
    .rotate()
    .resize({
      width: OCR_MAX_EDGE,
      height: OCR_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  timings.autoRotateResizeMs = Math.round(performance.now() - stageStartedAt);
  stageStartedAt = performance.now();
  const normalizedBuffer = normalized.data;
  const normalizedInfo = normalized.info;
  const stats = await sharp(normalizedBuffer).stats();
  timings.brightnessStatsMs = Math.round(performance.now() - stageStartedAt);
  stageStartedAt = performance.now();
  const blurVariance = await calculateBlurVariance(normalizedBuffer);
  timings.blurDetectionMs = Math.round(performance.now() - stageStartedAt);
  stageStartedAt = performance.now();
  const blurScore = scoreBlur(blurVariance);
  const resolutionScore = scoreResolution(normalizedInfo.width ?? 0, normalizedInfo.height ?? 0);
  const brightnessScore = scoreBrightness(stats.channels?.[0]?.mean);

  let processedBuffer = normalizedBuffer;
  let cropApplied = false;
  let cropInfo = {
    strategy: "none",
    cropQuality: 70,
    cropApplied: false,
    croppedWidth: normalizedInfo.width ?? 0,
    croppedHeight: normalizedInfo.height ?? 0
  };

  try {
    const trimmed = await sharp(normalizedBuffer).trim({ threshold: 18 }).jpeg({ quality: 92, mozjpeg: true }).toBuffer({ resolveWithObject: true });
    const cropQuality = scoreCrop(trimmed.info, normalizedInfo.width ?? trimmed.info.width, normalizedInfo.height ?? trimmed.info.height);
    const areaRatio =
      (trimmed.info.width * trimmed.info.height) / Math.max((normalizedInfo.width ?? trimmed.info.width) * (normalizedInfo.height ?? trimmed.info.height), 1);

    if (areaRatio >= 0.55 && areaRatio <= 0.97 && cropQuality >= 55) {
      processedBuffer = trimmed.data;
      cropApplied = true;
    }

    cropInfo = {
      strategy: cropApplied ? "trim-background" : "analyze-only",
      cropQuality,
      cropApplied,
      croppedWidth: trimmed.info.width,
      croppedHeight: trimmed.info.height,
      areaRatio: Number(areaRatio.toFixed(3))
    };
  } catch {
    cropInfo = {
      ...cropInfo,
      strategy: "not-applied"
    };
  }
  timings.cropDetectionMs = Math.round(performance.now() - stageStartedAt);

  const imageQualityScore = weightedScore([
    { value: blurScore, weight: 0.35 },
    { value: resolutionScore, weight: 0.25 },
    { value: cropInfo.cropQuality, weight: 0.25 },
    { value: brightnessScore, weight: 0.15 }
  ]);
  const rotationDetected = rotationApplied !== 0;

  return {
    buffer: processedBuffer,
    quality: {
      imageQualityScore,
      blurScore,
      blurVariance: Math.round(blurVariance),
      lowQuality: imageQualityScore < 65 || blurScore < 55,
      rotationDetected,
      rotationApplied,
      cropQuality: cropInfo.cropQuality,
      cropApplied,
      cropStrategy: cropInfo.strategy,
      originalWidth: metadata.width ?? null,
      originalHeight: metadata.height ?? null,
      workingWidth: normalizedInfo.width ?? null,
      workingHeight: normalizedInfo.height ?? null,
      resizedForOcr: Boolean(
        metadata.width &&
          metadata.height &&
          (metadata.width > (normalizedInfo.width ?? metadata.width) || metadata.height > (normalizedInfo.height ?? metadata.height))
      ),
      processedWidth: cropInfo.croppedWidth,
      processedHeight: cropInfo.croppedHeight,
      resolutionScore,
      brightnessScore,
      preprocessingTimings: {
        ...timings,
        totalPreprocessingMs: Math.round(performance.now() - startedAt)
      },
      warnings: buildWarnings({
        blurScore,
        cropQuality: cropInfo.cropQuality,
        resolutionScore,
        brightnessScore,
        rotationDetected
      }),
      suggestedActions: buildSuggestedActions({
        blurScore,
        cropQuality: cropInfo.cropQuality,
        resolutionScore,
        brightnessScore,
        rotationDetected
      })
    }
  };
}

function scoreOcrCoverage(rawText = "") {
  const characterCount = rawText.replace(/\s/g, "").length;

  if (characterCount >= 350) {
    return 95;
  }

  if (characterCount >= 180) {
    return 86;
  }

  if (characterCount >= 88) {
    return 76;
  }

  if (characterCount >= 40) {
    return 58;
  }

  return characterCount ? 38 : 0;
}

export function refineImageQualityAfterOcr({ imageQuality, ocrResult, mrzDetection }) {
  if (!imageQuality) {
    return imageQuality;
  }

  const ocrCoverageScore = scoreOcrCoverage(ocrResult?.rawText);
  const mrzReadable = Boolean(mrzDetection?.detected && (mrzDetection.readabilityScore ?? 0) >= 70);
  const highCoverage = ocrCoverageScore >= 76;
  const cropQuality = mrzReadable && highCoverage ? Math.max(imageQuality.cropQuality, 88) : imageQuality.cropQuality;
  const imageQualityScore = weightedScore([
    { value: imageQuality.blurScore, weight: 0.35 },
    { value: imageQuality.resolutionScore, weight: 0.25 },
    { value: cropQuality, weight: 0.25 },
    { value: imageQuality.brightnessScore, weight: 0.15 }
  ]);
  const warnings = buildWarnings({
    blurScore: imageQuality.blurScore,
    cropQuality,
    resolutionScore: imageQuality.resolutionScore,
    brightnessScore: imageQuality.brightnessScore,
    rotationDetected: imageQuality.rotationDetected
  });
  const suggestedActions = buildSuggestedActions({
    blurScore: imageQuality.blurScore,
    cropQuality,
    resolutionScore: imageQuality.resolutionScore,
    brightnessScore: imageQuality.brightnessScore,
    rotationDetected: imageQuality.rotationDetected
  });

  return {
    ...imageQuality,
    imageQualityScore,
    lowQuality: imageQualityScore < 65 || imageQuality.blurScore < 55,
    cropQuality,
    ocrCoverageScore,
    cropQualityAdjustedByOcr: cropQuality !== imageQuality.cropQuality,
    warnings,
    suggestedActions
  };
}
