import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { buildQrPayload } from "../utils/exportUtils.js";
import { CURRENT_RESULT_KEY } from "../services/storageService.js";
import { extractPassportImage } from "../services/extractionApi.js";
import { useLocalStorage } from "./useLocalStorage.js";

const ExtractionContext = createContext(null);

const processingStages = [
  "Uploading document",
  "Running Google Vision OCR",
  "Detecting MRZ lines",
  "Parsing ICAO 9303 fields",
  "Validating passport data",
  "Preparing results"
];

function attachClientResultData(result, imagePreview) {
  const enrichedResult = {
    ...result,
    imagePreview,
    rawText: result.rawText ?? result.rawOcrText ?? ""
  };

  return {
    ...enrichedResult,
    qrPayload: enrichedResult.qrPayload ?? buildQrPayload(enrichedResult)
  };
}

function markManualEdit(validation) {
  if (!validation) {
    return validation;
  }

  const hasManualEditItem = validation.items?.some((item) => item.key === "manualEdit");
  const manualEditItem = {
    key: "manualEdit",
    label: "Manual edit",
    status: "review",
    message: "One or more fields were edited locally and should be rechecked by running extraction again.",
    confidence: 60
  };
  const items = hasManualEditItem ? validation.items : [...(validation.items ?? []), manualEditItem];

  return {
    ...validation,
    status: validation.status === "valid" ? "review" : validation.status,
    reviewCount: hasManualEditItem ? validation.reviewCount : (validation.reviewCount ?? 0) + 1,
    items
  };
}

export function ExtractionProvider({ children }) {
  const [currentResult, setCurrentResult] = useLocalStorage(CURRENT_RESULT_KEY, null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(processingStages[0]);

  const runExtraction = useCallback(
    async ({ file, imagePreview, source }) => {
      setIsProcessing(true);
      setProgress(7);
      setStage(processingStages[0]);

      const timer = window.setInterval(() => {
        setProgress((value) => {
          const nextValue = Math.min(value + 9, 92);
          const stageIndex = Math.min(Math.floor((nextValue / 100) * processingStages.length), processingStages.length - 1);
          setStage(processingStages[stageIndex]);
          return nextValue;
        });
      }, 220);

      try {
        const result = await extractPassportImage({ file, source });
        const enrichedResult = attachClientResultData(result, imagePreview);
        setProgress(100);
        setStage(processingStages[processingStages.length - 1]);
        setCurrentResult(enrichedResult);
        return enrichedResult;
      } finally {
        window.clearInterval(timer);
        window.setTimeout(() => {
          setIsProcessing(false);
          setProgress(0);
          setStage(processingStages[0]);
        }, 360);
      }
    },
    [setCurrentResult]
  );

  const updateField = useCallback(
    (fieldName, value) => {
      setCurrentResult((current) => {
        if (!current) {
          return current;
        }

        const fields = { ...current.fields, [fieldName]: value };
        const nextResult = {
          ...current,
          fields,
          [fieldName]: value,
          validation: markManualEdit(current.validation),
          updatedAt: new Date().toISOString()
        };

        return { ...nextResult, qrPayload: buildQrPayload(nextResult) };
      });
    },
    [setCurrentResult]
  );

  const clearCurrentResult = useCallback(() => setCurrentResult(null), [setCurrentResult]);

  const value = useMemo(
    () => ({
      currentResult,
      setCurrentResult,
      clearCurrentResult,
      isProcessing,
      progress,
      stage,
      runExtraction,
      updateField
    }),
    [clearCurrentResult, currentResult, isProcessing, progress, runExtraction, setCurrentResult, stage, updateField]
  );

  return <ExtractionContext.Provider value={value}>{children}</ExtractionContext.Provider>;
}

export function useExtraction() {
  const context = useContext(ExtractionContext);

  if (!context) {
    throw new Error("useExtraction must be used inside ExtractionProvider.");
  }

  return context;
}
