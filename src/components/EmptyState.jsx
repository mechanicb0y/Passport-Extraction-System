import { ArrowRight, FileSearch } from "lucide-react";
import { Link } from "react-router-dom";

function EmptyState({ title, message, actionLabel = "Start extraction", actionTo = "/" }) {
  return (
    <section className="empty-state">
      <FileSearch size={34} aria-hidden="true" />
      <h1>{title}</h1>
      <p>{message}</p>
      <Link className="primary-button" to={actionTo}>
        {actionLabel}
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
}

export default EmptyState;
