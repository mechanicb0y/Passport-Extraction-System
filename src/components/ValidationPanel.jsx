import { BadgeCheck, CircleAlert, Gauge, ShieldAlert } from "lucide-react";
import MetricTile from "./MetricTile.jsx";
import StatusPill from "./StatusPill.jsx";

function ValidationPanel({ validation, confidence, ocrConfidence }) {
  if (!validation) {
    return null;
  }

  const ocrConfidenceValue = Number.isFinite(ocrConfidence) ? `${ocrConfidence}%` : "N/A";

  return (
    <section className="validation-panel">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Validation</span>
          <h2>Document confidence</h2>
        </div>
        <StatusPill status={validation.status} />
      </div>

      <div className="metrics-grid">
        <MetricTile label="Document confidence" value={`${confidence}%`} detail="OCR, MRZ, and validation signals" tone="blue" />
        <MetricTile label="Google OCR" value={ocrConfidenceValue} detail="Vision confidence or derived OCR signal" tone="default" />
        <MetricTile label="Validation score" value={`${validation.overallScore}%`} detail="ICAO 9303 backend checks" tone="yellow" />
        <MetricTile label="Valid checks" value={validation.validCount} detail="Passing signals" tone="green" />
        <MetricTile label="Review items" value={validation.reviewCount + validation.riskCount} detail="Needs attention" tone="red" />
      </div>

      <div className="validation-list">
        {(validation.items ?? []).map((item) => {
          const Icon = item.status === "valid" ? BadgeCheck : item.status === "review" ? CircleAlert : ShieldAlert;

          return (
            <article className={`validation-item validation-${item.status}`} key={item.key}>
              <Icon size={18} aria-hidden="true" />
              <div>
                <strong>{item.label}</strong>
                <span>{item.message}</span>
              </div>
              <small>{item.confidence}%</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ValidationPanel;
