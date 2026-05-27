import { getVisionClient } from "../config/googleVision.js";
import { normalizeMrzTextLine, normalizeSearchText } from "../utils/textNormalization.js";

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

function collectAnnotationConfidences(fullTextAnnotation) {
  const confidences = [];

  for (const page of fullTextAnnotation?.pages ?? []) {
    if (Number.isFinite(page.confidence) && page.confidence > 0) {
      confidences.push(page.confidence);
    }

    for (const block of page.blocks ?? []) {
      if (Number.isFinite(block.confidence) && block.confidence > 0) {
        confidences.push(block.confidence);
      }

      for (const paragraph of block.paragraphs ?? []) {
        if (Number.isFinite(paragraph.confidence) && paragraph.confidence > 0) {
          confidences.push(paragraph.confidence);
        }

        for (const word of paragraph.words ?? []) {
          if (Number.isFinite(word.confidence) && word.confidence > 0) {
            confidences.push(word.confidence);
          }

          for (const symbol of word.symbols ?? []) {
            if (Number.isFinite(symbol.confidence) && symbol.confidence > 0) {
              confidences.push(symbol.confidence);
            }
          }
        }
      }
    }
  }

  return confidences;
}

function toPercentConfidence(fullTextAnnotation) {
  const confidences = collectAnnotationConfidences(fullTextAnnotation);

  if (!confidences.length) {
    return null;
  }

  const average = confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
  return Math.round(Math.max(0, Math.min(1, average)) * 100);
}

function getTextStats(fullTextAnnotation) {
  const stats = {
    pageCount: fullTextAnnotation?.pages?.length ?? 0,
    blockCount: 0,
    paragraphCount: 0,
    wordCount: 0,
    symbolCount: 0
  };

  for (const page of fullTextAnnotation?.pages ?? []) {
    for (const block of page.blocks ?? []) {
      stats.blockCount += 1;

      for (const paragraph of block.paragraphs ?? []) {
        stats.paragraphCount += 1;

        for (const word of paragraph.words ?? []) {
          stats.wordCount += 1;
          stats.symbolCount += word.symbols?.length ?? 0;
        }
      }
    }
  }

  return stats;
}

function scoreTextVolume(rawText = "") {
  const characterCount = rawText.replace(/\s/g, "").length;

  if (!characterCount) {
    return 0;
  }

  if (characterCount >= 350) {
    return 92;
  }

  if (characterCount >= 180) {
    return 84;
  }

  if (characterCount >= 88) {
    return 74;
  }

  if (characterCount >= 40) {
    return 58;
  }

  return 38;
}

function scoreDetectedCount(count, strongCount, usableCount) {
  if (count >= strongCount) {
    return 90;
  }

  if (count >= usableCount) {
    return 74;
  }

  if (count > 0) {
    return 48;
  }

  return 0;
}

function scoreMrzLineQuality(line = "", expectedLine = 1) {
  const exactLength = line.length === 44 ? 100 : Math.max(0, 100 - Math.abs(44 - line.length) * 8);
  const charset = /^[A-Z0-9<]+$/.test(line) ? 100 : 35;
  const structure =
    expectedLine === 1
      ? weightedScore([
          { value: line.startsWith("P") ? 100 : 45, weight: 1 },
          { value: line.includes("<<") ? 100 : 55, weight: 1 }
        ])
      : weightedScore([
          { value: /^[A-Z0-9<]{9}[0-9]/.test(line) ? 100 : 50, weight: 1 },
          { value: /^\d{6}[0-9][MF<X]\d{6}/.test(line.slice(13)) ? 100 : 50, weight: 1 }
        ]);

  return weightedScore([
    { value: exactLength, weight: 0.45 },
    { value: charset, weight: 0.35 },
    { value: structure, weight: 0.2 }
  ]);
}

function visualTextWithoutMrz(rawText = "", mrzDetection) {
  const mrzLines = new Set([mrzDetection?.mrzLine1, mrzDetection?.mrzLine2].filter(Boolean));

  return rawText
    .split(/\r?\n/)
    .filter((line) => !mrzLines.has(normalizeMrzTextLine(line)))
    .join("\n");
}

function scoreVisualFieldMatches(rawText = "", mrzDetection, parsedMrz) {
  if (!parsedMrz?.isParsed) {
    return 0;
  }

  const fields = parsedMrz.fields;
  const visualText = normalizeSearchText(visualTextWithoutMrz(rawText, mrzDetection));

  if (!visualText) {
    return 52;
  }

  const signals = [
    Boolean(fields.passportNumber && visualText.includes(normalizeSearchText(fields.passportNumber))),
    Boolean(fields.surname && visualText.includes(normalizeSearchText(fields.surname))),
    Boolean(fields.givenNames && visualText.includes(normalizeSearchText(fields.givenNames))),
    Boolean(fields.nationality && visualText.includes(normalizeSearchText(fields.nationality)))
  ];
  const matchedCount = signals.filter(Boolean).length;

  if (matchedCount >= 3) {
    return 92;
  }

  if (matchedCount === 2) {
    return 80;
  }

  if (matchedCount === 1) {
    return 66;
  }

  return 45;
}

function scoreMrzSignal(mrzDetection, parsedMrz) {
  if (!mrzDetection?.detected) {
    return mrzDetection?.candidates?.length ? 42 : 0;
  }

  const lineQuality = weightedScore([
    { value: scoreMrzLineQuality(mrzDetection.mrzLine1, 1), weight: 1 },
    { value: scoreMrzLineQuality(mrzDetection.mrzLine2, 2), weight: 1 }
  ]);

  return parsedMrz?.isParsed
    ? weightedScore([
        { value: lineQuality, weight: 0.72 },
        { value: 100, weight: 0.28 }
      ])
    : lineQuality;
}

export function deriveOcrConfidence({ ocrResult, mrzDetection, parsedMrz }) {
  const rawText = ocrResult?.rawText ?? "";
  const hasText = Boolean(rawText.trim());
  const directConfidence = Number.isFinite(ocrResult?.directConfidence) && ocrResult.directConfidence > 0 ? ocrResult.directConfidence : null;
  const textVolumeScore = scoreTextVolume(rawText);
  const annotationScore = weightedScore([
    { value: ocrResult?.hasFullTextAnnotation ? 86 : 0, weight: 0.35 },
    { value: ocrResult?.textAnnotationCount ? 82 : 0, weight: 0.25 },
    { value: scoreDetectedCount(ocrResult?.stats?.wordCount ?? 0, 24, 8), weight: 0.25 },
    { value: scoreDetectedCount(ocrResult?.stats?.symbolCount ?? 0, 130, 44), weight: 0.15 }
  ]);
  const mrzScore = scoreMrzSignal(mrzDetection, parsedMrz);
  const visualFieldScore = scoreVisualFieldMatches(rawText, mrzDetection, parsedMrz);
  const derivedScore = weightedScore([
    { value: directConfidence ?? 0, weight: directConfidence ? 0.28 : 0 },
    { value: hasText ? 78 : 0, weight: 0.12 },
    { value: textVolumeScore, weight: 0.18 },
    { value: annotationScore, weight: 0.18 },
    { value: mrzScore, weight: mrzScore ? 0.26 : 0 },
    { value: visualFieldScore, weight: visualFieldScore ? 0.08 : 0 }
  ]);

  return {
    confidence: hasText ? Math.max(derivedScore, 35) : 0,
    source: directConfidence ? "vision-confidence-and-derived-signals" : "derived-ocr-signals",
    signals: {
      directConfidence,
      textVolumeScore,
      annotationScore,
      mrzScore,
      visualFieldScore
    }
  };
}

export async function runVisionOcr(imageBuffer) {
  try {
    const client = getVisionClient();
    const [result] = await client.textDetection({
      image: {
        content: imageBuffer.toString("base64")
      },
      imageContext: {
        textDetectionParams: {
          enableTextDetectionConfidenceScore: true
        }
      }
    });

    const rawText = result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || "";
    const directConfidence = toPercentConfidence(result.fullTextAnnotation);
    const stats = getTextStats(result.fullTextAnnotation);

    return {
      rawText,
      confidence: directConfidence,
      directConfidence,
      confidenceSource: directConfidence ? "vision-confidence" : "pending-derived-confidence",
      confidenceSignals: {},
      stats,
      hasFullTextAnnotation: Boolean(result.fullTextAnnotation),
      pages: stats.pageCount,
      textAnnotationCount: result.textAnnotations?.length ?? 0
    };
  } catch (error) {
    error.statusCode = error.statusCode || 502;
    error.publicMessage =
      "Google Vision OCR failed. Check backend credentials, Google Cloud Vision API access, and the uploaded image.";
    throw error;
  }
}
