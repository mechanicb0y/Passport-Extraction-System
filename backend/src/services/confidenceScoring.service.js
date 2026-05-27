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

function completenessScore(fields = {}) {
  const requiredFields = [
    "passportNumber",
    "fullName",
    "surname",
    "givenNames",
    "issuingCountry",
    "nationality",
    "dateOfBirth",
    "sex",
    "expiryDate",
    "mrzLine1",
    "mrzLine2",
    "documentType"
  ];
  const presentCount = requiredFields.filter((key) => Boolean(fields[key])).length;

  return Math.round((presentCount / requiredFields.length) * 100);
}

function averageItemScore(items = [], keys = []) {
  const selectedItems = keys.length ? items.filter((item) => keys.includes(item.key)) : items;

  return weightedScore(selectedItems.map((item) => ({ value: item.confidence, weight: item.weight ?? 1 })));
}

function inferredOcrSignal({ ocrConfidence, validation, mrzDetected }) {
  if (Number.isFinite(ocrConfidence)) {
    return clampScore(ocrConfidence);
  }

  const validationSignal = averageItemScore(validation?.items ?? []);
  const mrzSignal = mrzDetected ? 90 : 20;

  return weightedScore([
    { value: validationSignal, weight: validationSignal ? 0.65 : 0 },
    { value: mrzSignal, weight: 0.35 }
  ]);
}

export function calculateConfidenceScore({ ocrConfidence, validation, parsedMrz, mrzDetected, imageQuality }) {
  const normalizedOcrConfidence = inferredOcrSignal({ ocrConfidence, validation, mrzDetected });
  const validationScore = averageItemScore(validation?.items ?? []) || validation?.overallScore || 0;
  const checkDigitScore = averageItemScore(validation?.items ?? [], [
    "passportNumber",
    "dateOfBirth",
    "expiryDate",
    "compositeCheck"
  ]);
  const visualScore = averageItemScore(validation?.items ?? [], ["visualPassportNumber", "visualName"]);
  const completeness = completenessScore(parsedMrz?.fields);
  const mrzScore = mrzDetected && parsedMrz?.isParsed ? 100 : 0;

  return weightedScore([
    { value: normalizedOcrConfidence, weight: 0.22 },
    { value: validationScore, weight: 0.28 },
    { value: checkDigitScore, weight: checkDigitScore ? 0.2 : 0 },
    { value: visualScore, weight: visualScore ? 0.12 : 0 },
    { value: completeness, weight: 0.1 },
    { value: mrzScore, weight: 0.08 },
    { value: imageQuality?.imageQualityScore, weight: imageQuality ? 0.12 : 0 },
    { value: imageQuality?.mrzReadabilityScore, weight: imageQuality ? 0.14 : 0 }
  ]);
}
