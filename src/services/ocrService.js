import { countryProfiles, samplePeople } from "../data/countryProfiles.js";
import { addYears, toIsoDate } from "../utils/dateUtils.js";
import { buildMrzLines } from "../utils/mrzUtils.js";
import { hashString, pickBySeed, seededFloat, seededNumber } from "../utils/hashUtils.js";
import { buildQrPayload } from "../utils/exportUtils.js";
import { simulateFaceNameMatch, validatePassportData } from "./validationService.js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function id() {
  return crypto?.randomUUID?.() ?? `extract-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function numericPassport(seed, digits = 9) {
  let value = "";

  for (let index = 0; index < digits; index += 1) {
    value += String(seededNumber(seed + index * 17, 0, 9));
  }

  return value;
}

function alpha(seed, count = 1) {
  let value = "";

  for (let index = 0; index < count; index += 1) {
    value += LETTERS[seededNumber(seed + index * 31, 0, LETTERS.length - 1)];
  }

  return value;
}

function generatePassportNumber(profile, seed) {
  switch (profile.code) {
    case "USA":
    case "GBR":
      return numericPassport(seed, 9);
    case "SGP":
    case "PHL":
    case "IND":
      return `${alpha(seed)}${numericPassport(seed + 3, 7)}`;
    case "CAN":
      return `${alpha(seed, 2)}${numericPassport(seed + 5, 6)}`;
    case "AUS":
      return `${alpha(seed)}${numericPassport(seed + 7, 8)}`;
    case "FRA":
      return `${numericPassport(seed, 2)}${alpha(seed + 11, 2)}${numericPassport(seed + 13, 5)}`;
    case "JPN":
      return `${alpha(seed, 2)}${numericPassport(seed + 19, 7)}`;
    default:
      return `${alpha(seed, 2)}${numericPassport(seed + 23, 7)}`;
  }
}

function buildRawText(fields, profile, confidence) {
  return [
    "PASSPORT",
    `TYPE ${fields.documentType}`,
    `ISSUING COUNTRY ${profile.country.toUpperCase()} ${profile.code}`,
    `PASSPORT NO ${fields.passportNumber}`,
    `SURNAME ${fields.surname}`,
    `GIVEN NAMES ${fields.givenNames}`,
    `NATIONALITY ${fields.nationality}`,
    `DATE OF BIRTH ${fields.dateOfBirth}`,
    `SEX ${fields.sex}`,
    `PLACE OF BIRTH ${fields.placeOfBirth}`,
    `DATE OF ISSUE ${fields.issueDate}`,
    `DATE OF EXPIRY ${fields.expiryDate}`,
    `AUTHORITY ${fields.authority}`,
    fields.mrzLine1,
    fields.mrzLine2,
    `LOCAL OCR CONFIDENCE ${confidence}%`
  ].join("\n");
}

function fieldConfidence(seed) {
  return {
    fullName: seededNumber(seed + 1, 88, 98),
    passportNumber: seededNumber(seed + 2, 90, 99),
    nationality: seededNumber(seed + 3, 87, 98),
    dateOfBirth: seededNumber(seed + 4, 86, 97),
    expiryDate: seededNumber(seed + 5, 88, 99),
    mrzLine1: seededNumber(seed + 6, 84, 96),
    mrzLine2: seededNumber(seed + 7, 84, 96)
  };
}

export async function simulatePassportExtraction({ file, imagePreview, source = "upload" }) {
  const seedSource = `${file?.name ?? "camera"}-${file?.size ?? imagePreview?.length ?? 0}-${file?.lastModified ?? Date.now()}`;
  const seed = hashString(seedSource);
  const profile = pickBySeed(countryProfiles, seed);
  const person = pickBySeed(samplePeople, seed + 11);
  const now = new Date();
  const birthYear = now.getFullYear() - seededNumber(seed + 20, 22, 61);
  const birthDate = new Date(birthYear, seededNumber(seed + 21, 0, 11), seededNumber(seed + 22, 1, 27));
  const issueDate = new Date(now.getFullYear() - seededNumber(seed + 23, 0, 5), seededNumber(seed + 24, 0, 11), seededNumber(seed + 25, 1, 27));
  const expiryDate = addYears(issueDate, seededNumber(seed + 26, 5, 10));
  const fullName = `${person.givenNames} ${person.surname}`;
  const passportNumber = generatePassportNumber(profile, seed);
  const fields = {
    documentType: "P",
    passportNumber,
    fullName,
    givenNames: person.givenNames,
    surname: person.surname,
    nationality: profile.nationality,
    issuingCountry: profile.code,
    countryName: profile.country,
    sex: person.sex,
    dateOfBirth: toIsoDate(birthDate),
    placeOfBirth: pickBySeed(profile.placeOptions, seed + 31),
    issueDate: toIsoDate(issueDate),
    expiryDate: toIsoDate(expiryDate),
    authority: profile.authority
  };
  const mrz = buildMrzLines(fields);
  const confidence = seededNumber(seed + 40, 87, 98);
  const enrichedFields = { ...fields, ...mrz };
  const rawText = buildRawText(enrichedFields, profile, confidence);

  await wait(seededNumber(seed + 50, 900, 1500));

  const validation = validatePassportData(enrichedFields, rawText);
  const faceMatch = simulateFaceNameMatch(enrichedFields, seedSource);
  const result = {
    id: id(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seed,
    source,
    fileName: file?.name ?? "camera-capture.png",
    fileSize: file?.size ?? null,
    imagePreview,
    country: {
      code: profile.code,
      country: profile.country,
      nationality: profile.nationality
    },
    confidence,
    quality: {
      glare: `${seededFloat(seed + 60, 2, 12, 1)}%`,
      sharpness: seededNumber(seed + 61, 82, 97),
      cropIntegrity: seededNumber(seed + 62, 86, 99)
    },
    fields: enrichedFields,
    fieldConfidence: fieldConfidence(seed),
    validation,
    faceMatch,
    rawText,
    processingSteps: [
      "Image normalized locally",
      "MRZ region segmented",
      "Identity fields inferred",
      "Country profile matched",
      "Validation score calculated"
    ]
  };

  return { ...result, qrPayload: buildQrPayload(result) };
}
