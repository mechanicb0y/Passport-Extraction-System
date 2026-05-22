import { countryProfiles, getCountryProfile } from "../data/countryProfiles.js";
import { calculateAge, safeDate } from "../utils/dateUtils.js";
import { hashString, seededFloat } from "../utils/hashUtils.js";
import { hasValidMrzShape } from "../utils/mrzUtils.js";

function validationItem(key, label, status, message, confidence) {
  return { key, label, status, message, confidence };
}

function statusFromBoolean(value, reviewMessage = false) {
  if (value) {
    return "valid";
  }

  return reviewMessage ? "review" : "risk";
}

export function detectCountryFromText(rawText = "", fallbackCode = "USA") {
  const normalized = rawText.toUpperCase();
  const directMatch = countryProfiles.find((profile) => {
    return (
      normalized.includes(profile.code) ||
      normalized.includes(profile.country.toUpperCase()) ||
      normalized.includes(profile.nationality.toUpperCase()) ||
      normalized.includes(profile.authority.toUpperCase())
    );
  });

  const profile = directMatch ?? getCountryProfile(fallbackCode);
  const confidence = directMatch ? 96 : 82;

  return {
    code: profile.code,
    country: profile.country,
    nationality: profile.nationality,
    confidence
  };
}

export function validatePassportData(fields, rawText = "") {
  const profile = getCountryProfile(fields.issuingCountry);
  const passportMatches = profile.passportRegex.test(fields.passportNumber || "");
  const birthAge = calculateAge(fields.dateOfBirth);
  const expiry = safeDate(fields.expiryDate);
  const issue = safeDate(fields.issueDate);
  const today = new Date();
  const expiresInFuture = expiry ? expiry > today : false;
  const issuedBeforeExpiry = issue && expiry ? issue < expiry : false;
  const knownCountry = countryProfiles.some((country) => country.code === fields.issuingCountry);
  const detectedCountry = detectCountryFromText(rawText, fields.issuingCountry);
  const mrzLine1Valid = hasValidMrzShape(fields.mrzLine1 || "") && fields.mrzLine1.startsWith("P<");
  const mrzLine2Valid = hasValidMrzShape(fields.mrzLine2 || "");
  const fullNameValid = /^[A-Z][A-Z <'-]{3,}$/.test(fields.fullName || "");

  const items = [
    validationItem(
      "passportNumber",
      "Passport number",
      statusFromBoolean(passportMatches),
      passportMatches ? `Matches ${profile.country} format.` : `Expected ${profile.passportPattern}.`,
      passportMatches ? 98 : 48
    ),
    validationItem(
      "fullName",
      "Name format",
      statusFromBoolean(fullNameValid, true),
      fullNameValid ? "Name is readable and normalized." : "Name needs review.",
      fullNameValid ? 94 : 58
    ),
    validationItem(
      "dateOfBirth",
      "Date of birth",
      statusFromBoolean(birthAge !== null && birthAge >= 0 && birthAge <= 120),
      birthAge !== null ? `Age calculated as ${birthAge}.` : "Date could not be parsed.",
      birthAge !== null ? 92 : 35
    ),
    validationItem(
      "expiryDate",
      "Expiry date",
      statusFromBoolean(expiresInFuture),
      expiresInFuture ? "Passport is not expired." : "Passport is expired or invalid.",
      expiresInFuture ? 97 : 30
    ),
    validationItem(
      "issueDate",
      "Issue chronology",
      statusFromBoolean(issuedBeforeExpiry),
      issuedBeforeExpiry ? "Issue date is before expiry date." : "Issue and expiry dates conflict.",
      issuedBeforeExpiry ? 93 : 42
    ),
    validationItem(
      "issuingCountry",
      "Country detection",
      statusFromBoolean(knownCountry),
      knownCountry
        ? `${detectedCountry.country} detected with ${detectedCountry.confidence}% confidence.`
        : "Country code is not recognized.",
      knownCountry ? detectedCountry.confidence : 40
    ),
    validationItem(
      "mrzLine1",
      "MRZ line 1",
      statusFromBoolean(mrzLine1Valid, true),
      mrzLine1Valid ? "MRZ document row is complete." : "MRZ document row needs review.",
      mrzLine1Valid ? 95 : 55
    ),
    validationItem(
      "mrzLine2",
      "MRZ line 2",
      statusFromBoolean(mrzLine2Valid, true),
      mrzLine2Valid ? "MRZ data row is complete." : "MRZ data row needs review.",
      mrzLine2Valid ? 95 : 55
    )
  ];

  const statusWeights = { valid: 1, review: 0.66, risk: 0.2 };
  const overallScore = Math.round(
    items.reduce((total, item) => total + item.confidence * statusWeights[item.status], 0) / items.length
  );
  const riskCount = items.filter((item) => item.status === "risk").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const validCount = items.filter((item) => item.status === "valid").length;

  return {
    overallScore,
    status: riskCount > 0 ? "risk" : reviewCount > 0 ? "review" : "valid",
    validCount,
    reviewCount,
    riskCount,
    detectedCountry,
    items
  };
}

export function simulateFaceNameMatch(fields, seedSource = "") {
  const seed = hashString(`${fields.fullName}-${fields.passportNumber}-${seedSource}`);
  const base = seededFloat(seed, 82, 98, 1);
  const nameQuality = (fields.fullName || "").split(" ").filter(Boolean).length >= 2 ? 2 : -8;
  const score = Math.max(42, Math.min(99, Math.round(base + nameQuality)));

  return {
    score,
    status: score >= 88 ? "valid" : score >= 74 ? "review" : "risk",
    label: score >= 88 ? "Strong match" : score >= 74 ? "Manual review" : "Low match",
    evidence:
      score >= 88
        ? "Portrait region, document name, and image quality are consistent in the local simulation."
        : "The simulated portrait/name score should be manually checked before relying on this result."
  };
}
