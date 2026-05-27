import { normalizeMrzTextLine, normalizeSearchText } from "../utils/textNormalization.js";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function usableOcrConfidence(ocrConfidence, fallbackSignal = 50) {
  return Number.isFinite(ocrConfidence) ? clampScore(ocrConfidence) : clampScore(fallbackSignal);
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

function createItem(key, label, status, message, confidence, weight = 1) {
  return { key, label, status, message, confidence: clampScore(confidence), weight };
}

function statusFromCheck(check) {
  return check?.isValid ? "valid" : "risk";
}

function mrzLineQuality(line = "", expectedLine = 1) {
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

function checkDigitConfidence(check, ocrSignal, lineQuality) {
  return weightedScore([
    { value: check?.isValid ? 100 : 8, weight: 0.55 },
    { value: ocrSignal, weight: 0.25 },
    { value: lineQuality, weight: 0.2 }
  ]);
}

function checkDigitItem(key, label, check, ocrSignal, lineQuality) {
  const status = statusFromCheck(check);
  const message =
    status === "valid"
      ? `${label} check digit matches ICAO 9303.`
      : `${label} check digit failed. Expected ${check?.expected || "unknown"}, calculated ${check?.actual || "unknown"}.`;

  return createItem(key, label, status, message, checkDigitConfidence(check, ocrSignal, lineQuality), 1.25);
}

function visualTextWithoutMrz(rawOcrText, mrzDetection) {
  const mrzLines = new Set([mrzDetection?.mrzLine1, mrzDetection?.mrzLine2].filter(Boolean));

  return rawOcrText
    .split(/\r?\n/)
    .filter((line) => !mrzLines.has(normalizeMrzTextLine(line)))
    .join("\n");
}

function buildVisualConsistencyItems(fields, rawOcrText, mrzDetection, ocrSignal) {
  const visualText = normalizeSearchText(visualTextWithoutMrz(rawOcrText, mrzDetection));
  const passportNumber = normalizeSearchText(fields.passportNumber);
  const surname = normalizeSearchText(fields.surname);
  const givenNames = normalizeSearchText(fields.givenNames);
  const hasVisualText = visualText.length > 0;
  const nameMatched = Boolean(surname && visualText.includes(surname)) || Boolean(givenNames && visualText.includes(givenNames));
  const passportMatched = Boolean(passportNumber && visualText.includes(passportNumber));

  return [
    createItem(
      "visualPassportNumber",
      "Visual passport number",
      passportMatched ? "valid" : "review",
      passportMatched
        ? "Passport number appears in the non-MRZ OCR text."
        : hasVisualText
          ? "Passport number was parsed from MRZ but not confirmed in the visual-zone OCR text."
          : "No readable visual-zone text was available to compare passport number.",
      weightedScore([
        { value: passportMatched ? 100 : hasVisualText ? 42 : 55, weight: 0.65 },
        { value: ocrSignal, weight: 0.35 }
      ]),
      0.8
    ),
    createItem(
      "visualName",
      "Visual name comparison",
      nameMatched ? "valid" : "review",
      nameMatched
        ? "Name text appears in the non-MRZ OCR text."
        : hasVisualText
          ? "Name was parsed from MRZ but not confirmed in visual-zone OCR."
          : "No readable visual-zone text was available to compare name.",
      weightedScore([
        { value: nameMatched ? 100 : hasVisualText ? 45 : 55, weight: 0.65 },
        { value: ocrSignal, weight: 0.35 }
      ]),
      0.8
    )
  ];
}

function summarizeValidation(items) {
  const validCount = items.filter((item) => item.status === "valid").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const riskCount = items.filter((item) => item.status === "risk").length;
  const score = weightedScore(items.map((item) => ({ value: item.confidence, weight: item.weight ?? 1 })));

  return {
    status: riskCount ? "risk" : reviewCount ? "review" : "valid",
    overallScore: score,
    validCount,
    reviewCount,
    riskCount
  };
}

export function validatePassportExtraction({ mrzDetection, parsedMrz, rawOcrText, ocrConfidence, imageQuality }) {
  const items = [];
  const hasOcrText = Boolean(rawOcrText?.trim());
  const warnings = [
    ...(imageQuality?.warnings ?? []),
    ...(mrzDetection?.warnings ?? []),
    ...(parsedMrz?.warnings ?? []),
    ...(parsedMrz?.errors ?? [])
  ];
  const candidateSignal = mrzDetection?.candidates?.length ? 45 + Math.min(mrzDetection.candidates.length * 5, 25) : 30;
  const ocrSignal = usableOcrConfidence(ocrConfidence, candidateSignal);

  items.push(
    createItem(
      "ocrText",
      "OCR text detection",
      hasOcrText ? "valid" : "risk",
      hasOcrText ? "Passport text was detected by OCR." : "OCR did not return readable text from the image.",
      hasOcrText ? ocrSignal : 8,
      1.1
    )
  );

  if (imageQuality) {
    items.push(
      createItem(
        "imageQuality",
        "Image quality",
        imageQuality.imageQualityScore >= 70 ? "valid" : imageQuality.imageQualityScore >= 55 ? "review" : "risk",
        imageQuality.imageQualityScore >= 70
          ? "Image quality is suitable for OCR and MRZ extraction."
          : "Image quality may reduce OCR and MRZ extraction reliability.",
        imageQuality.imageQualityScore,
        1.1
      )
    );
    items.push(
      createItem(
        "blurScore",
        "Blur detection",
        imageQuality.blurScore >= 70 ? "valid" : imageQuality.blurScore >= 50 ? "review" : "risk",
        imageQuality.blurScore >= 70
          ? "Image sharpness is acceptable."
          : "Image appears blurry. Retake a sharper passport image.",
        imageQuality.blurScore
      )
    );
    items.push(
      createItem(
        "cropQuality",
        "Document visibility",
        imageQuality.cropQuality >= 75 ? "valid" : imageQuality.cropQuality >= 55 ? "review" : "risk",
        imageQuality.cropQuality >= 75
          ? "Passport page appears sufficiently visible."
          : "Passport appears partially cropped or the page boundary is unclear.",
        imageQuality.cropQuality
      )
    );
    items.push(
      createItem(
        "rotationDetected",
        "Rotation",
        imageQuality.rotationDetected ? "review" : "valid",
        imageQuality.rotationDetected
          ? "Passport appears rotated; the backend corrected orientation before OCR."
          : "No EXIF rotation correction was required.",
        imageQuality.rotationDetected ? 68 : 94,
        0.7
      )
    );
  }

  if (!mrzDetection?.detected || !parsedMrz?.isParsed) {
    const failureLabel = !hasOcrText ? "OCR failure" : !mrzDetection?.detected ? "MRZ detection failure" : "MRZ parsing failure";
    const failureMessage = !hasOcrText
      ? "OCR could not read passport text. Try a clearer image with better lighting."
      : !mrzDetection?.detected
        ? "Passport text detected but MRZ could not be read."
        : "MRZ-like text was detected, but it could not be parsed as valid TD3 passport MRZ.";

    items.push(
      createItem(
        "mrzLine1",
        failureLabel,
        "risk",
        failureMessage,
        weightedScore([
          { value: ocrSignal, weight: 0.25 },
          { value: candidateSignal, weight: 0.35 },
          { value: 8, weight: 0.4 }
        ]),
        1.4
      )
    );
    items.push(
      createItem(
        "mrzReadability",
        "MRZ readability",
        (imageQuality?.mrzReadabilityScore ?? 0) >= 70 ? "valid" : (imageQuality?.mrzReadabilityScore ?? 0) >= 45 ? "review" : "risk",
        mrzDetection?.failureReason || "MRZ readability is too low for reliable extraction.",
        imageQuality?.mrzReadabilityScore ?? 0,
        1.2
      )
    );

    return {
      ...summarizeValidation(items),
      items,
      warnings,
      suggestedActions: imageQuality?.suggestedActions ?? [
        "Retake image",
        "Improve lighting",
        "Keep MRZ fully visible",
        "Avoid glare/reflections",
        "Capture passport straight-on"
      ],
      failureType: !hasOcrText ? "OCR_FAILURE" : !mrzDetection?.detected ? "MRZ_DETECTION_FAILURE" : "MRZ_PARSING_FAILURE",
      userMessage: failureMessage
    };
  }

  const fields = parsedMrz.fields;
  const checks = parsedMrz.checks;
  const line1Quality = mrzLineQuality(fields.mrzLine1, 1);
  const line2Quality = mrzLineQuality(fields.mrzLine2, 2);

  items.push(
    createItem(
      "mrzLine1",
      "MRZ line 1",
      "valid",
      "First TD3 MRZ line is 44 characters with valid MRZ characters.",
      weightedScore([
        { value: line1Quality, weight: 0.65 },
        { value: ocrSignal, weight: 0.35 }
      ]),
      1.1
    )
  );
  items.push(
    createItem(
      "mrzReadability",
      "MRZ readability",
      (imageQuality?.mrzReadabilityScore ?? 90) >= 80 ? "valid" : "review",
      (imageQuality?.mrzReadabilityScore ?? 90) >= 80
        ? "MRZ lines were readable enough for parsing."
        : "MRZ lines were parsed, but readability is lower than ideal.",
      imageQuality?.mrzReadabilityScore ?? 90,
      1
    )
  );
  items.push(
    createItem(
      "mrzLine2",
      "MRZ line 2",
      "valid",
      "Second TD3 MRZ line is 44 characters with valid MRZ characters.",
      weightedScore([
        { value: line2Quality, weight: 0.65 },
        { value: ocrSignal, weight: 0.35 }
      ]),
      1.1
    )
  );
  items.push(
    createItem(
      "documentType",
      "Document type",
      fields.documentType?.startsWith("P") ? "valid" : "review",
      fields.documentType?.startsWith("P")
        ? "Document code indicates a passport."
        : `Document code "${fields.documentType || "unknown"}" should be reviewed.`,
      weightedScore([
        { value: fields.documentType?.startsWith("P") ? 100 : 45, weight: 0.55 },
        { value: line1Quality, weight: 0.25 },
        { value: ocrSignal, weight: 0.2 }
      ])
    )
  );
  items.push(checkDigitItem("passportNumber", "Passport number", checks.passportNumber, ocrSignal, line2Quality));
  items.push(checkDigitItem("dateOfBirth", "Date of birth", checks.dateOfBirth, ocrSignal, line2Quality));
  items.push(checkDigitItem("expiryDate", "Expiry date", checks.expiryDate, ocrSignal, line2Quality));
  items.push(checkDigitItem("compositeCheck", "Composite MRZ", checks.composite, ocrSignal, line2Quality));

  const birthDate = parsedMrz.dates.dateOfBirth;
  items.push(
    createItem(
      "dateOfBirthFormat",
      "Birth date format",
      birthDate.isValid ? "valid" : "risk",
      birthDate.isValid ? "Birth date is a real calendar date." : birthDate.message,
      weightedScore([
        { value: birthDate.isValid ? 100 : 10, weight: 0.65 },
        { value: checks.dateOfBirth?.isValid ? 100 : 10, weight: 0.2 },
        { value: ocrSignal, weight: 0.15 }
      ])
    )
  );

  const expiryDate = parsedMrz.dates.expiryDate;
  items.push(
    createItem(
      "expiryDateActive",
      "Expiry status",
      expiryDate.isValid && !expiryDate.isPast ? "valid" : "risk",
      expiryDate.isValid && !expiryDate.isPast
        ? "Passport expiry date is still active."
        : expiryDate.isValid
          ? "Passport expiry date is in the past."
          : expiryDate.message,
      weightedScore([
        { value: expiryDate.isValid && !expiryDate.isPast ? 100 : expiryDate.isValid ? 35 : 10, weight: 0.6 },
        { value: checks.expiryDate?.isValid ? 100 : 10, weight: 0.25 },
        { value: ocrSignal, weight: 0.15 }
      ]),
      1.1
    )
  );

  const issuingCountry = parsedMrz.countries.issuingCountry;
  items.push(
    createItem(
      "issuingCountry",
      "Issuing country",
      issuingCountry.isKnown ? "valid" : "review",
      issuingCountry.isKnown
        ? `${fields.issuingCountry} resolved to ${issuingCountry.name}.`
        : `${fields.issuingCountry || "Country code"} could not be verified against known ISO/ICAO codes.`,
      weightedScore([
        { value: issuingCountry.isKnown ? 100 : 48, weight: 0.55 },
        { value: line1Quality, weight: 0.25 },
        { value: ocrSignal, weight: 0.2 }
      ])
    )
  );

  const nationality = parsedMrz.countries.nationality;
  items.push(
    createItem(
      "nationality",
      "Nationality",
      nationality.isKnown ? "valid" : "review",
      nationality.isKnown
        ? `${fields.nationality} resolved to ${nationality.name}.`
        : `${fields.nationality || "Nationality code"} could not be verified against known ISO/ICAO codes.`,
      weightedScore([
        { value: nationality.isKnown ? 100 : 48, weight: 0.55 },
        { value: line2Quality, weight: 0.25 },
        { value: ocrSignal, weight: 0.2 }
      ])
    )
  );

  items.push(...buildVisualConsistencyItems(fields, rawOcrText, mrzDetection, ocrSignal));

  return {
    ...summarizeValidation(items),
    items,
    warnings,
    suggestedActions: imageQuality?.suggestedActions ?? [],
    failureType: "",
    userMessage: ""
  };
}
