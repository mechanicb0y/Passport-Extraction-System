export function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function addYears(date, years) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

export function safeDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function calculateAge(dateOfBirth, referenceDate = new Date()) {
  const birth = safeDate(dateOfBirth);

  if (!birth) {
    return null;
  }

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDelta = referenceDate.getMonth() - birth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && referenceDate.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

export function formatDisplayDate(value) {
  const date = safeDate(value);

  if (!date) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(date);
}

export function toCompactMrzDate(value) {
  const date = safeDate(value);

  if (!date) {
    return "000000";
  }

  return `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
