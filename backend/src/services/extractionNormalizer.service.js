function buildQrPayload(extraction) {
  return {
    id: extraction.id,
    fullName: extraction.fields.fullName,
    passportNumber: extraction.fields.passportNumber,
    nationality: extraction.fields.nationality,
    issuingCountry: extraction.fields.issuingCountry,
    expiryDate: extraction.fields.expiryDate,
    validationScore: extraction.validation.overallScore,
    confidence: extraction.confidence,
    generatedAt: new Date().toISOString()
  };
}

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

function buildFieldConfidence({ fields, validation, confidence, ocrConfidence, parsedMrz }) {
  const itemByKey = new Map((validation.items ?? []).map((item) => [item.key, item]));
  const itemScore = (key) => itemByKey.get(key)?.confidence;
  const ocrSignal = Number.isFinite(ocrConfidence) ? clampScore(ocrConfidence) : confidence;
  const sourceSignal = parsedMrz?.isParsed ? 100 : 15;
  const presenceScore = (key) => (fields[key] ? 100 : 0);
  const line1Score = itemScore("mrzLine1");
  const line2Score = itemScore("mrzLine2");

  const fieldScore = (key, parts) => {
    return [
      key,
      weightedScore([
        { value: presenceScore(key), weight: 0.18 },
        { value: ocrSignal, weight: 0.18 },
        { value: sourceSignal, weight: 0.12 },
        ...parts
      ])
    ];
  };

  return Object.fromEntries(
    Object.keys(fields).map((key) => {
      switch (key) {
        case "mrzLine1":
          return fieldScore(key, [{ value: line1Score, weight: 0.52 }]);
        case "mrzLine2":
          return fieldScore(key, [{ value: line2Score, weight: 0.52 }]);
        case "passportNumber":
          return fieldScore(key, [
            { value: itemScore("passportNumber"), weight: 0.34 },
            { value: itemScore("visualPassportNumber"), weight: 0.1 },
            { value: line2Score, weight: 0.08 }
          ]);
        case "dateOfBirth":
          return fieldScore(key, [
            { value: itemScore("dateOfBirth"), weight: 0.22 },
            { value: itemScore("dateOfBirthFormat"), weight: 0.18 },
            { value: line2Score, weight: 0.12 }
          ]);
        case "expiryDate":
          return fieldScore(key, [
            { value: itemScore("expiryDate"), weight: 0.2 },
            { value: itemScore("expiryDateActive"), weight: 0.2 },
            { value: line2Score, weight: 0.12 }
          ]);
        case "fullName":
        case "surname":
        case "givenNames":
          return fieldScore(key, [
            { value: itemScore("visualName"), weight: 0.16 },
            { value: line1Score, weight: 0.22 },
            { value: confidence, weight: 0.14 }
          ]);
        case "issuingCountry":
        case "issuingCountryName":
          return fieldScore(key, [
            { value: itemScore("issuingCountry"), weight: 0.32 },
            { value: line1Score, weight: 0.12 },
            { value: confidence, weight: 0.08 }
          ]);
        case "nationality":
        case "nationalityName":
          return fieldScore(key, [
            { value: itemScore("nationality"), weight: 0.32 },
            { value: line2Score, weight: 0.12 },
            { value: confidence, weight: 0.08 }
          ]);
        case "documentType":
          return fieldScore(key, [
            { value: itemScore("documentType"), weight: 0.34 },
            { value: line1Score, weight: 0.12 },
            { value: confidence, weight: 0.06 }
          ]);
        case "sex":
        case "optionalData":
          return fieldScore(key, [
            { value: line2Score, weight: 0.32 },
            { value: confidence, weight: 0.2 }
          ]);
        default:
          return fieldScore(key, [{ value: confidence, weight: 0.52 }]);
      }
    })
  );
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1].replace(/\s+/g, " ").trim().toUpperCase();
    }
  }

  return "";
}

function extractFallbackFieldsFromOcr(rawText = "", mrzDetection) {
  const normalized = rawText.toUpperCase();
  const passportNumber = firstMatch(normalized, [
    /PASSPORT\s*(?:NO|NUMBER|#)\s*[:\-]?\s*([A-Z0-9<]{6,14})/,
    /DOCUMENT\s*(?:NO|NUMBER|#)\s*[:\-]?\s*([A-Z0-9<]{6,14})/,
    /\b([A-Z][0-9]{7,9}|[A-Z]{1,2}[0-9]{6,9}|[0-9]{8,10})\b/
  ]);
  const surname = firstMatch(normalized, [/SURNAME\s*[:\-]?\s*([A-Z][A-Z <'-]{1,40})/, /LAST\s*NAME\s*[:\-]?\s*([A-Z][A-Z <'-]{1,40})/]);
  const givenNames = firstMatch(normalized, [
    /GIVEN\s*NAMES?\s*[:\-]?\s*([A-Z][A-Z <'-]{1,50})/,
    /FIRST\s*NAME\s*[:\-]?\s*([A-Z][A-Z <'-]{1,50})/
  ]);
  const nationality = firstMatch(normalized, [/NATIONALITY\s*[:\-]?\s*([A-Z]{3,30})/]);
  const sex = firstMatch(normalized, [/\bSEX\s*[:\-]?\s*([MFX])\b/, /\bGENDER\s*[:\-]?\s*([MFX])\b/]);
  const dateOfBirth = firstMatch(normalized, [
    /DATE\s*OF\s*BIRTH\s*[:\-]?\s*([0-9]{4}[-/.][0-9]{2}[-/.][0-9]{2})/,
    /\bDOB\s*[:\-]?\s*([0-9]{4}[-/.][0-9]{2}[-/.][0-9]{2})/
  ]).replace(/[/.]/g, "-");
  const expiryDate = firstMatch(normalized, [
    /(?:DATE\s*OF\s*)?EXPIRY\s*[:\-]?\s*([0-9]{4}[-/.][0-9]{2}[-/.][0-9]{2})/,
    /EXPIRES\s*[:\-]?\s*([0-9]{4}[-/.][0-9]{2}[-/.][0-9]{2})/
  ]).replace(/[/.]/g, "-");

  return {
    passportNumber,
    fullName: [givenNames, surname].filter(Boolean).join(" ").trim(),
    surname,
    givenNames,
    issuingCountry: "",
    issuingCountryName: "",
    nationality,
    nationalityName: nationality,
    dateOfBirth,
    sex,
    expiryDate,
    mrzLine1: mrzDetection?.mrzLine1 || "",
    mrzLine2: mrzDetection?.mrzLine2 || "",
    documentType: "",
    optionalData: ""
  };
}

function emptyFields(mrzDetection, rawText) {
  const fallbackFields = extractFallbackFieldsFromOcr(rawText, mrzDetection);

  return {
    ...fallbackFields,
    issuingCountry: "",
    issuingCountryName: fallbackFields.issuingCountryName || "",
    nationalityName: fallbackFields.nationalityName || fallbackFields.nationality || ""
  };
}

function buildStatusSummary({ validation, ocrResult, mrzDetection, imageQuality }) {
  if (validation.failureType === "OCR_FAILURE") {
    return {
      title: "OCR could not read this passport image",
      message: "Try uploading a clearer image with better lighting and the full passport page visible."
    };
  }

  if (validation.failureType === "MRZ_DETECTION_FAILURE") {
    return {
      title: "Passport text detected, but MRZ could not be read",
      message: "Keep the two MRZ lines fully visible, straight, sharp, and free from glare."
    };
  }

  if (validation.failureType === "MRZ_PARSING_FAILURE") {
    return {
      title: "MRZ text detected, but parsing failed",
      message: "The OCR text contains MRZ-like characters, but the TD3 passport structure or check digits could not be trusted."
    };
  }

  if (imageQuality?.lowQuality) {
    return {
      title: "Passport extracted with image quality warnings",
      message: "Review the fields carefully or retake the image for stronger confidence."
    };
  }

  return {
    title: "Passport extraction completed",
    message: "MRZ parsing and validation completed."
  };
}

export function normalizeExtractionResponse({
  file,
  source,
  ocrResult,
  mrzDetection,
  parsedMrz,
  validation,
  confidence,
  imageQuality,
  processingTimings
}) {
  const now = new Date().toISOString();
  const fields = parsedMrz?.isParsed ? parsedMrz.fields : emptyFields(mrzDetection, ocrResult.rawText);
  const statusSummary = buildStatusSummary({ validation, ocrResult, mrzDetection, imageQuality });
  const extraction = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    source,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    country: {
      code: fields.issuingCountry,
      country: fields.issuingCountryName || fields.issuingCountry || "Unknown",
      nationality: fields.nationalityName || fields.nationality || "Unknown"
    },
    confidence,
    ocrConfidence: ocrResult.confidence,
    ocrConfidenceSource: ocrResult.confidenceSource,
    ocrConfidenceSignals: ocrResult.confidenceSignals,
    imageQuality,
    processingTimings,
    statusSummary,
    fields,
    validation,
    warnings: [...new Set([...(validation.warnings ?? []), ...(imageQuality?.warnings ?? [])])],
    suggestedActions: validation.suggestedActions ?? imageQuality?.suggestedActions ?? [],
    failureType: validation.failureType ?? "",
    rawOcrText: ocrResult.rawText,
    rawText: ocrResult.rawText,
    processingSteps: [
      "Uploaded image received by backend",
      "Image auto-rotation, crop analysis, blur detection, and quality scoring completed",
      "Google Vision OCR text extraction completed",
      "TD3 MRZ lines detected from OCR text",
      "ICAO 9303 MRZ parser extracted passport fields",
      "MRZ check digits and document rules validated",
      "Confidence score and export payload normalized"
    ],
    passportNumber: fields.passportNumber,
    fullName: fields.fullName,
    surname: fields.surname,
    givenNames: fields.givenNames,
    issuingCountry: fields.issuingCountry,
    nationality: fields.nationality,
    dateOfBirth: fields.dateOfBirth,
    sex: fields.sex,
    expiryDate: fields.expiryDate,
    mrzLine1: fields.mrzLine1,
    mrzLine2: fields.mrzLine2,
    documentType: fields.documentType
  };

  return {
    ...extraction,
    fieldConfidence: buildFieldConfidence({
      fields,
      validation,
      confidence,
      ocrConfidence: ocrResult.confidence,
      parsedMrz
    }),
    qrPayload: buildQrPayload(extraction)
  };
}
