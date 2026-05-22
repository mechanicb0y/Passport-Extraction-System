import { ScanFace } from "lucide-react";
import StatusPill from "./StatusPill.jsx";

function FaceMatchPanel({ faceMatch }) {
  if (!faceMatch) {
    return null;
  }

  return (
    <section className="face-match-panel">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">AI validation</span>
          <h2>Face/name match</h2>
        </div>
        <ScanFace size={20} aria-hidden="true" />
      </div>
      <div className="score-ring" style={{ "--score": `${faceMatch.score}%` }}>
        <strong>{faceMatch.score}%</strong>
        <span>{faceMatch.label}</span>
      </div>
      <StatusPill status={faceMatch.status} label={faceMatch.label} />
      <p>{faceMatch.evidence}</p>
    </section>
  );
}

export default FaceMatchPanel;
