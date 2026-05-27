import { BookOpenCheck, Database, FileCode2, ShieldCheck } from "lucide-react";
import PrivacyNotice from "../components/PrivacyNotice.jsx";
import { guideSections, validationExplainers } from "../data/helpContent.js";

function HelpPage() {
  return (
    <div className="page-stack help-page">
      <section className="page-title-row">
        <div>
          <span className="eyebrow">Guide</span>
          <h1>Passport extraction workflow</h1>
          <p>Operational notes for uploading, validating, editing, saving, and exporting passport extraction results.</p>
        </div>
      </section>

      <PrivacyNotice />

      <section className="guide-grid">
        {guideSections.map((section) => (
          <article className="guide-card" key={section.title}>
            <BookOpenCheck size={22} aria-hidden="true" />
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="help-split">
        <article className="info-panel">
          <div className="section-heading compact-heading">
            <div>
              <span className="eyebrow">OCR model</span>
              <h2>OCR and country logic</h2>
            </div>
            <FileCode2 size={21} aria-hidden="true" />
          </div>
          <p>
            The backend sends the uploaded image to Google Vision OCR, detects TD3 passport MRZ rows in the returned text, parses ICAO
            9303 field positions, and resolves issuing country and nationality codes when possible.
          </p>
        </article>

        <article className="info-panel">
          <div className="section-heading compact-heading">
            <div>
              <span className="eyebrow">Validation model</span>
              <h2>AI checks</h2>
            </div>
            <ShieldCheck size={21} aria-hidden="true" />
          </div>
          <div className="explain-list">
            {validationExplainers.map((item) => (
              <div key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="info-panel">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">Storage and exports</span>
            <h2>Local data behavior</h2>
          </div>
          <Database size={21} aria-hidden="true" />
        </div>
        <p>
          The latest result and saved history use versioned localStorage keys. JSON export contains metadata, extracted fields,
          validation, warnings, and raw OCR text. CSV export flattens the same result into a two-column table for spreadsheets.
        </p>
      </section>
    </div>
  );
}

export default HelpPage;
