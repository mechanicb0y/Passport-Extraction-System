import { normalizeMrzTextLine } from "../utils/textNormalization.js";

const td3LineLength = 44;
const td3CharsetPattern = /^[A-Z0-9<]{44}$/;

function repairCandidate(value) {
  const warnings = [];

  if (value.length === td3LineLength) {
    return { value, warnings };
  }

  if (value.length > td3LineLength && value.length <= 48) {
    warnings.push(`Trimmed an OCR MRZ candidate from ${value.length} to 44 characters.`);
    return { value: value.slice(0, td3LineLength), warnings };
  }

  if (value.length >= 40 && value.length < td3LineLength) {
    warnings.push(`Padded an OCR MRZ candidate from ${value.length} to 44 characters.`);
    return { value: value.padEnd(td3LineLength, "<"), warnings };
  }

  return { value, warnings };
}

function lineScore(value, expectedLine) {
  let score = 0;

  if (td3CharsetPattern.test(value)) {
    score += 20;
  }

  if (expectedLine === 1 && value.startsWith("P")) {
    score += 25;
  }

  if (expectedLine === 1 && value.includes("<<")) {
    score += 15;
  }

  if (expectedLine === 2 && /^[A-Z0-9<]{9}[0-9]/.test(value)) {
    score += 20;
  }

  if (expectedLine === 2 && /^\d{6}[0-9][MF<X]\d{6}/.test(value.slice(13))) {
    score += 25;
  }

  if ((value.match(/</g) ?? []).length >= 3) {
    score += 10;
  }

  return score;
}

function buildCandidates(rawText) {
  const candidates = [];
  const lines = rawText.split(/\r?\n/);

  lines.forEach((line, index) => {
    const normalized = normalizeMrzTextLine(line);

    if (normalized.length >= 40 && normalized.length <= 48 && /[<]/.test(normalized)) {
      const repaired = repairCandidate(normalized);
      candidates.push({
        lineIndex: index,
        value: repaired.value,
        warnings: repaired.warnings
      });
    }

    if (normalized.length >= 88 && normalized.length <= 96 && normalized.startsWith("P")) {
      const first = repairCandidate(normalized.slice(0, 44));
      const second = repairCandidate(normalized.slice(44, 88));
      candidates.push({ lineIndex: index, value: first.value, warnings: first.warnings });
      candidates.push({ lineIndex: index, value: second.value, warnings: second.warnings });
    }
  });

  return candidates.filter((candidate) => td3CharsetPattern.test(candidate.value));
}

export function detectMrzLines(rawText = "") {
  const candidates = buildCandidates(rawText);
  let bestPair = null;

  for (let index = 0; index < candidates.length - 1; index += 1) {
    const first = candidates[index];
    const second = candidates[index + 1];
    const adjacentPenalty = second.lineIndex - first.lineIndex <= 2 ? 0 : -10;
    const score = lineScore(first.value, 1) + lineScore(second.value, 2) + adjacentPenalty;

    if (!bestPair || score > bestPair.score) {
      bestPair = { first, second, score };
    }
  }

  if (!bestPair || bestPair.score < 55) {
    return {
      detected: false,
      mrzLine1: "",
      mrzLine2: "",
      readabilityScore: Math.max(0, Math.min(45, Math.round((bestPair?.score ?? candidates.length * 10) * 0.55))),
      failureReason: candidates.length
        ? "OCR found MRZ-like text, but it was incomplete or structurally invalid."
        : "OCR text did not include two readable TD3 passport MRZ lines.",
      warnings: ["TD3 passport MRZ lines were not detected in the OCR text."],
      candidates: candidates.map((candidate) => candidate.value)
    };
  }

  return {
    detected: true,
    mrzLine1: bestPair.first.value,
    mrzLine2: bestPair.second.value,
    readabilityScore: Math.max(55, Math.min(100, Math.round((bestPair.score / 145) * 100))),
    failureReason: "",
    warnings: [...bestPair.first.warnings, ...bestPair.second.warnings],
    candidates: candidates.map((candidate) => candidate.value)
  };
}
