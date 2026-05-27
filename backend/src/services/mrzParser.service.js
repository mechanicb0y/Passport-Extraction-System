import { validateMrzCheckDigit } from "../utils/mrzCheckDigit.js";
import { parseMrzDate } from "../utils/dateUtils.js";
import { lookupCountryCode, normalizeCountryCode } from "../utils/countryCodes.js";

const td3Length = 44;
const td3CharsetPattern = /^[A-Z0-9<]{44}$/;

function cleanMrzName(value = "") {
  return value
    .replace(/<+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMrzField(value = "") {
  return value.replace(/<+$/g, "").replace(/</g, "").trim();
}

function parseNameBlock(nameBlock = "") {
  const [surnamePart = "", givenPart = ""] = nameBlock.split("<<");
  const surname = cleanMrzName(surnamePart);
  const givenNames = cleanMrzName(givenPart);
  const fullName = [givenNames, surname].filter(Boolean).join(" ").trim();

  return {
    surname,
    givenNames,
    fullName: fullName || surname || givenNames
  };
}

export function parseTd3Mrz(mrzLine1 = "", mrzLine2 = "") {
  const errors = [];
  const warnings = [];

  if (mrzLine1.length !== td3Length || mrzLine2.length !== td3Length) {
    errors.push("TD3 MRZ requires exactly two 44-character lines.");
  }

  if (!td3CharsetPattern.test(mrzLine1) || !td3CharsetPattern.test(mrzLine2)) {
    errors.push("MRZ contains characters outside A-Z, 0-9, and <.");
  }

  if (errors.length) {
    return {
      isParsed: false,
      errors,
      warnings,
      fields: {},
      checks: {}
    };
  }

  const documentCodeRaw = mrzLine1.slice(0, 2);
  const documentType = cleanMrzField(documentCodeRaw) || documentCodeRaw[0];
  const issuingCountry = normalizeCountryCode(mrzLine1.slice(2, 5));
  const names = parseNameBlock(mrzLine1.slice(5));
  const passportNumberRaw = mrzLine2.slice(0, 9);
  const passportNumber = cleanMrzField(passportNumberRaw);
  const nationality = normalizeCountryCode(mrzLine2.slice(10, 13));
  const birthDate = parseMrzDate(mrzLine2.slice(13, 19), "birth");
  const expiryDate = parseMrzDate(mrzLine2.slice(21, 27), "expiry");
  const optionalData = mrzLine2.slice(28, 42);
  const compositeSource = `${mrzLine2.slice(0, 10)}${mrzLine2.slice(13, 20)}${mrzLine2.slice(21, 43)}`;
  const issuingCountryProfile = lookupCountryCode(issuingCountry);
  const nationalityProfile = lookupCountryCode(nationality);

  const checks = {
    passportNumber: validateMrzCheckDigit(passportNumberRaw, mrzLine2[9]),
    dateOfBirth: validateMrzCheckDigit(mrzLine2.slice(13, 19), mrzLine2[19]),
    expiryDate: validateMrzCheckDigit(mrzLine2.slice(21, 27), mrzLine2[27]),
    composite: validateMrzCheckDigit(compositeSource, mrzLine2[43])
  };

  if (!documentType.startsWith("P")) {
    warnings.push(`Document type "${documentType}" is not a standard passport document code.`);
  }

  return {
    isParsed: true,
    errors,
    warnings,
    fields: {
      documentType,
      passportNumber,
      fullName: names.fullName,
      surname: names.surname,
      givenNames: names.givenNames,
      issuingCountry,
      issuingCountryName: issuingCountryProfile.name,
      nationality,
      nationalityName: nationalityProfile.name,
      dateOfBirth: birthDate.value,
      sex: mrzLine2[20] === "<" ? "X" : mrzLine2[20],
      expiryDate: expiryDate.value,
      optionalData: cleanMrzField(optionalData),
      mrzLine1,
      mrzLine2
    },
    dates: {
      dateOfBirth: birthDate,
      expiryDate
    },
    countries: {
      issuingCountry: issuingCountryProfile,
      nationality: nationalityProfile
    },
    checks
  };
}
