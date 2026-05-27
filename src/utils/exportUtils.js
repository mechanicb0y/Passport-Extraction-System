export function buildExportPayload(result) {
  if (!result) {
    return {};
  }

  return {
    id: result.id,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    source: result.source,
    fileName: result.fileName,
    country: result.country,
    confidence: result.confidence,
    ocrConfidence: result.ocrConfidence,
    ocrConfidenceSource: result.ocrConfidenceSource,
    ocrConfidenceSignals: result.ocrConfidenceSignals,
    imageQuality: result.imageQuality,
    processingTimings: result.processingTimings,
    statusSummary: result.statusSummary,
    suggestedActions: result.suggestedActions,
    failureType: result.failureType,
    fields: result.fields,
    validation: result.validation,
    warnings: result.warnings,
    rawOcrText: result.rawOcrText ?? result.rawText,
    rawText: result.rawText ?? result.rawOcrText
  };
}

export function buildQrPayload(result) {
  return {
    id: result.id,
    fullName: result.fields.fullName,
    passportNumber: result.fields.passportNumber,
    nationality: result.fields.nationality,
    issuingCountry: result.fields.issuingCountry,
    expiryDate: result.fields.expiryDate,
    validationScore: result.validation.overallScore,
    generatedAt: new Date().toISOString()
  };
}

export function stringifyJson(result) {
  return JSON.stringify(buildExportPayload(result), null, 2);
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(result) {
  const payload = buildExportPayload(result);
  const rows = [
    ["Field", "Value"],
    ["Extraction ID", payload.id],
    ["Created At", payload.createdAt],
    ["Source", payload.source],
    ["File Name", payload.fileName],
    ["Country", payload.country?.country],
    ["Country Code", payload.country?.code],
    ["Overall Confidence", payload.confidence],
    ["OCR Confidence", payload.ocrConfidence],
    ["Validation Score", payload.validation?.overallScore],
    ["Warnings", (payload.warnings ?? []).join("; ")],
    ...Object.entries(payload.fields ?? {}).map(([key, value]) => [key, value])
  ];

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function downloadBlob(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildSafeFileName(result, extension) {
  const passportNumber = result?.fields?.passportNumber || "passport";
  return `${passportNumber.toLowerCase()}-extraction.${extension}`;
}
