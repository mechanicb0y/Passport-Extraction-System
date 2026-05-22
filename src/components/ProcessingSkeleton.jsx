function ProcessingSkeleton({ progress, stage }) {
  return (
    <section className="processing-panel" aria-live="polite" aria-busy="true">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Processing</span>
          <h2>{stage}</h2>
        </div>
        <strong>{Math.round(progress)}%</strong>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="skeleton-grid">
        <span className="skeleton-line wide" />
        <span className="skeleton-line" />
        <span className="skeleton-line short" />
        <span className="skeleton-block" />
      </div>
    </section>
  );
}

export default ProcessingSkeleton;
