export const HISTORY_KEY = "passport-extraction-history-v1";
export const CURRENT_RESULT_KEY = "passport-extraction-current-v1";
const HISTORY_LIMIT = 50;

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function getHistory() {
  if (typeof localStorage === "undefined") {
    return [];
  }

  const entries = parseJson(localStorage.getItem(HISTORY_KEY), []);
  return Array.isArray(entries) ? entries : [];
}

export function saveHistoryItem(result) {
  const current = getHistory();
  const savedItem = {
    ...result,
    savedAt: new Date().toISOString()
  };
  const withoutDuplicate = current.filter((item) => item.id !== result.id);
  const next = [savedItem, ...withoutDuplicate].slice(0, HISTORY_LIMIT);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function deleteHistoryItem(id) {
  const next = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  return [];
}
