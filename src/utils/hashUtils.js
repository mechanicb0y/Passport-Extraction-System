export function hashString(input = "") {
  let hash = 2166136261;
  const value = String(input);

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

export function pickBySeed(items, seed) {
  if (!items.length) {
    return undefined;
  }

  return items[Math.abs(seed) % items.length];
}

export function seededNumber(seed, min, max) {
  const normalized = Math.abs(Math.sin(seed) * 10000) % 1;
  return Math.floor(normalized * (max - min + 1)) + min;
}

export function seededFloat(seed, min, max, precision = 2) {
  const normalized = Math.abs(Math.sin(seed * 1.37) * 10000) % 1;
  return Number((normalized * (max - min) + min).toFixed(precision));
}
