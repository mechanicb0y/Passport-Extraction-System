import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { buildQrPayload } from "../utils/exportUtils.js";
import { CURRENT_RESULT_KEY } from "../services/storageService.js";
import { simulatePassportExtraction } from "../services/ocrService.js";
import { simulateFaceNameMatch, validatePassportData } from "../services/validationService.js";
import { useLocalStorage } from "./useLocalStorage.js";

const ExtractionContext = createContext(null);

const processingStages = [
  "Normalizing image",
  "Finding document borders",
  "Running OCR simulation",
  "Reading MRZ lines",
  "Extracting identity fields",
  "Running validation",
  "Preparing results"
];

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
        const result = await simulatePassportExtraction({ file, imagePreview, source });
        setProgress(100);
        setStage(processingStages[processingStages.length - 1]);
        setCurrentResult(result);
        return result;
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
        const validation = validatePassportData(fields, current.rawText);
        const faceMatch = simulateFaceNameMatch(fields, current.seed);
        const nextResult = {
          ...current,
          fields,
          validation,
          faceMatch,
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
