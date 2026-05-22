import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, Search, Trash2 } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { useExtraction } from "../hooks/useExtractionState.jsx";
import { useToast } from "../hooks/useToast.jsx";
import { clearHistory, deleteHistoryItem, getHistory } from "../services/storageService.js";
import { buildSafeFileName, downloadBlob, stringifyJson } from "../utils/exportUtils.js";
import { formatDisplayDate } from "../utils/dateUtils.js";

function HistoryPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { setCurrentResult } = useExtraction();
  const [history, setHistory] = useState(() => getHistory());
  const [query, setQuery] = useState("");

  const filteredHistory = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return history;
    }

    return history.filter((item) => {
      const searchable = [item.fields.fullName, item.fields.passportNumber, item.country.country, item.fields.nationality]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [history, query]);

  const restoreItem = (item) => {
    setCurrentResult(item);
    navigate("/results");
  };

  const removeItem = (id) => {
    const next = deleteHistoryItem(id);
    setHistory(next);
    notify({ type: "info", title: "History item deleted", message: "The localStorage entry was removed." });
  };

  const removeAll = () => {
    if (!window.confirm("Clear all saved passport extraction history on this device?")) {
      return;
    }

    setHistory(clearHistory());
    notify({ type: "info", title: "History cleared", message: "All local history entries were removed." });
  };

  if (!history.length) {
    return <EmptyState title="No saved history" message="Save an extraction from the results page to keep it in localStorage." />;
  }

  return (
    <div className="page-stack history-page">
      <section className="page-title-row">
        <div>
          <span className="eyebrow">Local history</span>
          <h1>Saved extractions</h1>
          <p>{history.length} saved result{history.length === 1 ? "" : "s"} on this device.</p>
        </div>
        <button className="icon-text-button danger" type="button" onClick={removeAll}>
          <Trash2 size={17} aria-hidden="true" />
          Clear history
        </button>
      </section>

      <label className="search-control">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search name, passport number, country, or nationality"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <section className="history-list" aria-label="Saved extraction history">
        {filteredHistory.map((item) => (
          <article className="history-item" key={item.id}>
            <div className="history-thumb">{item.imagePreview ? <img src={item.imagePreview} alt="" /> : <span>{item.country.code}</span>}</div>
            <div className="history-content">
              <div>
                <h2>{item.fields.fullName}</h2>
                <p>
                  {item.fields.passportNumber} - {item.country.country} - expires {formatDisplayDate(item.fields.expiryDate)}
                </p>
              </div>
              <div className="history-badges">
                <StatusPill status={item.validation.status} />
                <span>{item.validation.overallScore}% validation</span>
                <span>{item.faceMatch.score}% face/name</span>
              </div>
            </div>
            <div className="history-actions">
              <button className="icon-text-button" type="button" onClick={() => restoreItem(item)}>
                <Eye size={17} aria-hidden="true" />
                View
              </button>
              <button
                className="icon-text-button subtle"
                type="button"
                onClick={() => downloadBlob(stringifyJson(item), buildSafeFileName(item, "json"), "application/json")}
              >
                <Download size={17} aria-hidden="true" />
                JSON
              </button>
              <button className="icon-button danger" type="button" onClick={() => removeItem(item.id)} aria-label={`Delete ${item.fields.fullName}`}>
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </section>

      {!filteredHistory.length ? (
        <section className="empty-inline">
          <strong>No matches found</strong>
          <span>Try a different name, passport number, or country.</span>
        </section>
      ) : null}
    </div>
  );
}

export default HistoryPage;
