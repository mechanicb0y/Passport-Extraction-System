import { toCompactMrzDate } from "./dateUtils.js";

const MRZ_WEIGHTS = [7, 3, 1];

export function normalizeMrzText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9< ]/g, "")
    .replace(/\s+/g, "<");
}

function mrzValue(character) {
  if (character >= "0" && character <= "9") {
    return Number(character);
  }

  if (character >= "A" && character <= "Z") {
    return character.charCodeAt(0) - 55;
  }

  return 0;
}

export function checkDigit(input = "") {
  return String(
    input.split("").reduce((total, character, index) => total + mrzValue(character) * MRZ_WEIGHTS[index % 3], 0) % 10
  );
}

export function padMrz(value, length = 44) {
  return normalizeMrzText(value).padEnd(length, "<").slice(0, length);
}

export function buildMrzLines(fields) {
  const surname = normalizeMrzText(fields.surname || fields.fullName?.split(" ").slice(-1)[0] || "UNKNOWN");
  const givenNames = normalizeMrzText(fields.givenNames || fields.fullName?.split(" ").slice(0, -1).join(" ") || "TRAVELER");
  const countryCode = normalizeMrzText(fields.issuingCountry || fields.countryCode || "UTO").slice(0, 3);
  const passportNumber = normalizeMrzText(fields.passportNumber).padEnd(9, "<").slice(0, 9);
  const birthDate = toCompactMrzDate(fields.dateOfBirth);
  const expiryDate = toCompactMrzDate(fields.expiryDate);
  const sex = ["M", "F", "X"].includes(fields.sex) ? fields.sex : "<";
  const optionalData = "<<<<<<<<<<<<<<<";

  const line1 = padMrz(`P<${countryCode}${surname}<<${givenNames}`);
  const line2Core = `${passportNumber}${checkDigit(passportNumber)}${countryCode}${birthDate}${checkDigit(
    birthDate
  )}${sex}${expiryDate}${checkDigit(expiryDate)}${optionalData}`;
  const line2 = padMrz(`${line2Core}${checkDigit(line2Core)}`);

  return { mrzLine1: line1, mrzLine2: line2 };
}

export function hasValidMrzShape(line = "") {
  return /^[A-Z0-9<]{44}$/.test(line);
}
