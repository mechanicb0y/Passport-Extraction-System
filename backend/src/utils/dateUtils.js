function toIsoDate(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isRealDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseMrzDate(value = "", mode = "birth", now = new Date()) {
  if (!/^\d{6}$/.test(value)) {
    return {
      value: "",
      raw: value,
      isValid: false,
      isPast: false,
      message: "MRZ date must use YYMMDD digits."
    };
  }

  const yearPart = Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  const day = Number(value.slice(4, 6));
  const currentYear = now.getUTCFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  let year = currentCentury + yearPart;

  if (mode === "birth" && Date.UTC(year, month - 1, day) > now.getTime()) {
    year -= 100;
  }

  if (mode === "expiry") {
    if (year < currentYear - 80) {
      year += 100;
    }

    if (year > currentYear + 20) {
      year -= 100;
    }
  }

  const isValid = isRealDate(year, month, day);
  const isoDate = isValid ? toIsoDate(year, month, day) : "";
  const dateTime = isValid ? Date.UTC(year, month - 1, day, 23, 59, 59) : 0;

  return {
    value: isoDate,
    raw: value,
    isValid,
    isPast: isValid ? dateTime < now.getTime() : false,
    message: isValid ? "Valid MRZ date." : "MRZ date is not a real calendar date."
  };
}
