import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";

const statusContent = {
  valid: { label: "Valid", icon: CheckCircle2 },
  review: { label: "Review", icon: CircleDashed },
  risk: { label: "Risk", icon: AlertTriangle },
  neutral: { label: "Info", icon: CircleDashed }
};

function StatusPill({ status = "neutral", label }) {
  const content = statusContent[status] ?? statusContent.neutral;
  const Icon = content.icon;

  return (
    <span className={`status-pill status-${status}`}>
      <Icon size={14} aria-hidden="true" />
      {label ?? content.label}
    </span>
  );
}

export default StatusPill;
