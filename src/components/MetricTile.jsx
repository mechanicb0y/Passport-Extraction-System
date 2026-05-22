function MetricTile({ label, value, detail, tone = "default" }) {
  return (
    <div className={`metric-tile metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

export default MetricTile;
