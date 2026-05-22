import { ClipboardCopy, Download, FileJson, TableProperties } from "lucide-react";
import { buildSafeFileName, downloadBlob, stringifyJson, toCsv } from "../utils/exportUtils.js";

function ExportActions({ result, onCopied }) {
  const copyJson = async () => {
    await navigator.clipboard.writeText(stringifyJson(result));
    onCopied?.();
  };

  return (
    <section className="export-panel">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Export</span>
          <h2>Structured output</h2>
        </div>
      </div>
      <div className="export-actions">
        <button className="icon-text-button" type="button" onClick={copyJson}>
          <ClipboardCopy size={17} aria-hidden="true" />
          Copy JSON
        </button>
        <button
          className="icon-text-button"
          type="button"
          onClick={() => downloadBlob(stringifyJson(result), buildSafeFileName(result, "json"), "application/json")}
        >
          <FileJson size={17} aria-hidden="true" />
          Download JSON
        </button>
        <button
          className="icon-text-button"
          type="button"
          onClick={() => downloadBlob(toCsv(result), buildSafeFileName(result, "csv"), "text/csv")}
        >
          <TableProperties size={17} aria-hidden="true" />
          Download CSV
        </button>
      </div>
      <pre className="json-preview" aria-label="JSON extraction preview">
        {stringifyJson(result)}
      </pre>
    </section>
  );
}

export default ExportActions;
