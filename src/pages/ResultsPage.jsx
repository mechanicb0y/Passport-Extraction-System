import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import ExportActions from "../components/ExportActions.jsx";
import FaceMatchPanel from "../components/FaceMatchPanel.jsx";
import FieldEditor from "../components/FieldEditor.jsx";
import ImagePreview from "../components/ImagePreview.jsx";
import QRCodePanel from "../components/QRCodePanel.jsx";
import ValidationPanel from "../components/ValidationPanel.jsx";
import { useExtraction } from "../hooks/useExtractionState.jsx";
import { useToast } from "../hooks/useToast.jsx";
import { saveHistoryItem } from "../services/storageService.js";
import { formatDisplayDate } from "../utils/dateUtils.js";

function ResultsPage() {
  const { currentResult, updateField, clearCurrentResult } = useExtraction();
  const { notify } = useToast();
  const [savedId, setSavedId] = useState("");

  useEffect(() => {
    setSavedId("");
  }, [currentResult?.id]);

  if (!currentResult) {
    return <EmptyState title="No extraction loaded" message="Run a passport extraction or restore one from history to view results." />;
  }

  const saveToHistory = () => {
    saveHistoryItem(currentResult);
    setSavedId(currentResult.id);
    notify({ type: "success", title: "Saved to history", message: "The extraction is stored in localStorage on this device." });
  };

  const clearResult = () => {
    clearCurrentResult();
    notify({ type: "info", title: "Current result cleared", message: "Saved history entries were not changed." });
  };

  return (
    <div className="page-stack results-page">
      <section className="page-title-row">
        <div>
          <Link className="text-link" to="/">
            <ArrowLeft size={16} aria-hidden="true" />
            Upload another image
          </Link>
          <h1>{currentResult.fields.fullName}</h1>
          <p>
            {currentResult.country.country} passport {currentResult.fields.passportNumber}, expires{" "}
            {formatDisplayDate(currentResult.fields.expiryDate)}.
          </p>
        </div>
        <div className="toolbar-row">
          <button className="icon-text-button" type="button" onClick={saveToHistory}>
            <Save size={17} aria-hidden="true" />
            {savedId === currentResult.id ? "Saved" : "Save history"}
          </button>
          <button className="icon-text-button danger" type="button" onClick={clearResult}>
            <Trash2 size={17} aria-hidden="true" />
            Clear
          </button>
        </div>
      </section>

      <div className="results-layout">
        <div className="results-main">
          <ValidationPanel validation={currentResult.validation} confidence={currentResult.confidence} />
          <FieldEditor
            fields={currentResult.fields}
            validation={currentResult.validation}
            fieldConfidence={currentResult.fieldConfidence}
            onFieldChange={updateField}
          />
          <ExportActions
            result={currentResult}
            onCopied={() =>
              notify({ type: "success", title: "JSON copied", message: "The extraction payload is ready on your clipboard." })
            }
          />
        </div>

        <aside className="results-side">
          <ImagePreview imagePreview={currentResult.imagePreview} file={{ name: currentResult.fileName, size: currentResult.fileSize }} compact />
          <FaceMatchPanel faceMatch={currentResult.faceMatch} />
          <QRCodePanel result={currentResult} />
          <section className="raw-text-panel">
            <div className="section-heading compact-heading">
              <div>
                <span className="eyebrow">OCR text</span>
                <h2>Simulated raw output</h2>
              </div>
            </div>
            <pre>{currentResult.rawText}</pre>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default ResultsPage;
