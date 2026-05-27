const mrzLookalikes = new Map([
  ["«", "<"],
  ["‹", "<"],
  ["＜", "<"],
  [" ", ""],
  ["\t", ""]
]);

export function normalizeMrzTextLine(line = "") {
  let normalized = line.normalize("NFKC").toUpperCase();

  for (const [from, to] of mrzLookalikes.entries()) {
    normalized = normalized.split(from).join(to);
  }

  return normalized.replace(/[^A-Z0-9<]/g, "");
}

export function normalizeSearchText(text = "") {
  return text
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}
