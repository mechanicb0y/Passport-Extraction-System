import { AlertTriangle, Camera, CheckCircle2, RotateCw } from "lucide-react";
import MetricTile from "./MetricTile.jsx";

function scoreValue(value) {
  return Number.isFinite(value) ? `${value}%` : "N/A";
}

function QualityInsights({ imageQuality, processingTimings, warnings = [], suggestedActions = [], statusSummary }) {
  if (!imageQuality && !processingTimings && !warnings.length && !suggestedActions.length && !statusSummary) {
    return null;
  }

  return (
    <section className="quality-panel">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Image diagnostics</span>
          <h2>{statusSummary?.title || "Quality indicators"}</h2>
          {statusSummary?.message ? <p>{statusSummary.message}</p> : null}
        </div>
        {imageQuality?.rotationDetected ? <RotateCw size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
      </div>

      {imageQuality ? (
        <div className="metrics-grid quality-grid">
          <MetricTile label="Image quality" value={scoreValue(imageQuality.imageQualityScore)} detail="Overall capture quality" tone="blue" />
          <MetricTile label="Blur score" value={scoreValue(imageQuality.blurScore)} detail="Sharpness for OCR" tone="yellow" />
          <MetricTile label="Crop quality" value={scoreValue(imageQuality.cropQuality)} detail="Full page visibility" tone="green" />
          <MetricTile label="MRZ readability" value={scoreValue(imageQuality.mrzReadabilityScore)} detail="Machine-readable zone" tone="red" />
          <MetricTile
            label="Rotation"
            value={imageQuality.rotationDetected ? `${imageQuality.rotationApplied}deg` : "None"}
            detail={imageQuality.rotationDetected ? "Corrected before OCR" : "No rotation correction"}
            tone="default"
          />
        </div>
      ) : null}

      {warnings.length ? (
        <div className="quality-message-list">
          {warnings.map((warning) => (
            <div className="quality-message warning" key={warning}>
              <AlertTriangle size={17} aria-hidden="true" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      ) : null}

      {suggestedActions.length ? (
        <div className="suggested-actions">
          <strong>
            <Camera size={16} aria-hidden="true" />
            Suggested actions
          </strong>
          <ul>
            {suggestedActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {processingTimings ? (
        <div className="timing-list">
          <strong>Processing timing</strong>
          <dl>
            <div>
              <dt>Preprocessing</dt>
              <dd>{processingTimings.preprocessingMs} ms</dd>
            </div>
            <div>
              <dt>OCR</dt>
              <dd>{processingTimings.ocrMs} ms</dd>
            </div>
            <div>
              <dt>MRZ parsing</dt>
              <dd>{processingTimings.mrzParsingMs} ms</dd>
            </div>
            <div>
              <dt>Validation</dt>
              <dd>{processingTimings.validationMs} ms</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{processingTimings.totalExtractionMs} ms</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  );
}

export default QualityInsights;
