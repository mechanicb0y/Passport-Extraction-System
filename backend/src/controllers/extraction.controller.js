import { performance } from "node:perf_hooks";
import { deriveOcrConfidence, runVisionOcr } from "../services/googleVision.service.js";
import { preprocessPassportImage, refineImageQualityAfterOcr } from "../services/imagePreprocessing.service.js";
import { detectMrzLines } from "../services/mrzDetection.service.js";
import { parseTd3Mrz } from "../services/mrzParser.service.js";
import { validatePassportExtraction } from "../services/passportValidation.service.js";
import { calculateConfidenceScore } from "../services/confidenceScoring.service.js";
import { normalizeExtractionResponse } from "../services/extractionNormalizer.service.js";

export async function extractPassport(request, response, next) {
  const totalStartedAt = performance.now();
  try {
    if (!request.file) {
      const error = new Error("Passport image is required.");
      error.statusCode = 400;
      throw error;
    }

    const source = request.body?.source || "upload";
    const preprocessingStartedAt = performance.now();
    const preprocessing = await preprocessPassportImage(request.file.buffer);
    const preprocessingMs = Math.round(performance.now() - preprocessingStartedAt);

    const ocrStartedAt = performance.now();
    const ocrResult = await runVisionOcr(preprocessing.buffer);
    const ocrMs = Math.round(performance.now() - ocrStartedAt);

    const mrzStartedAt = performance.now();
    const mrzDetection = detectMrzLines(ocrResult.rawText);
    const parsedMrz = mrzDetection.detected ? parseTd3Mrz(mrzDetection.mrzLine1, mrzDetection.mrzLine2) : null;
    const mrzParsingMs = Math.round(performance.now() - mrzStartedAt);
    const refinedQuality = refineImageQualityAfterOcr({
      imageQuality: preprocessing.quality,
      ocrResult,
      mrzDetection
    });
    const imageQuality = {
      ...refinedQuality,
      mrzReadabilityScore: mrzDetection.readabilityScore,
      suggestedActions: [
        ...new Set([
          ...(refinedQuality.suggestedActions ?? []),
          ...(mrzDetection.detected ? [] : ["Keep MRZ fully visible", "Retake image"])
        ])
      ]
    };
    const ocrConfidence = deriveOcrConfidence({ ocrResult, mrzDetection, parsedMrz });
    const enrichedOcrResult = {
      ...ocrResult,
      confidence: ocrConfidence.confidence,
      confidenceSource: ocrConfidence.source,
      confidenceSignals: ocrConfidence.signals
    };

    const validationStartedAt = performance.now();
    const validation = validatePassportExtraction({
      mrzDetection,
      parsedMrz,
      rawOcrText: enrichedOcrResult.rawText,
      ocrConfidence: enrichedOcrResult.confidence,
      imageQuality
    });
    const validationMs = Math.round(performance.now() - validationStartedAt);
    const confidence = calculateConfidenceScore({
      ocrConfidence: enrichedOcrResult.confidence,
      validation,
      parsedMrz,
      mrzDetected: mrzDetection.detected,
      imageQuality
    });
    const processingTimings = {
      preprocessingMs,
      ocrMs,
      mrzParsingMs,
      validationMs,
      totalExtractionMs: Math.round(performance.now() - totalStartedAt),
      preprocessingBreakdown: imageQuality.preprocessingTimings ?? {}
    };

    const extraction = normalizeExtractionResponse({
      file: request.file,
      source,
      ocrResult: enrichedOcrResult,
      mrzDetection,
      parsedMrz,
      validation,
      confidence,
      imageQuality,
      processingTimings
    });

    response.json({ data: extraction });
  } catch (error) {
    next(error);
  }
}
