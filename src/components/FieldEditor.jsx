import { RefreshCw } from "lucide-react";
import StatusPill from "./StatusPill.jsx";

const fieldGroups = [
  {
    title: "Identity",
    fields: [
      { key: "fullName", label: "Full name", type: "text" },
      { key: "givenNames", label: "Given names", type: "text" },
      { key: "surname", label: "Surname", type: "text" },
      { key: "sex", label: "Sex", type: "select", options: ["M", "F", "X"] },
      { key: "dateOfBirth", label: "Date of birth", type: "date" },
      { key: "nationalityName", label: "Nationality name", type: "text" }
    ]
  },
  {
    title: "Passport",
    fields: [
      { key: "documentType", label: "Document type", type: "text" },
      { key: "passportNumber", label: "Passport number", type: "text" },
      { key: "nationality", label: "Nationality", type: "text" },
      { key: "issuingCountry", label: "Issuing country", type: "text" },
      { key: "expiryDate", label: "Expiry date", type: "date" },
      { key: "issuingCountryName", label: "Issuing country name", type: "text" },
      { key: "optionalData", label: "Optional MRZ data", type: "text" }
    ]
  },
  {
    title: "Machine readable zone",
    fields: [
      { key: "mrzLine1", label: "MRZ line 1", type: "text", wide: true },
      { key: "mrzLine2", label: "MRZ line 2", type: "text", wide: true }
    ]
  }
];

function getValidationStatus(validation, key) {
  return validation?.items?.find((item) => item.key === key)?.status;
}

function FieldEditor({ fields, validation, fieldConfidence, onFieldChange }) {
  return (
    <section className="field-editor">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Editable output</span>
          <h2>Extracted passport fields</h2>
        </div>
        <span className="subtle-inline">
          <RefreshCw size={15} aria-hidden="true" />
          Manual edits affect exports
        </span>
      </div>

      {fieldGroups.map((group) => (
        <div className="field-group" key={group.title}>
          <h3>{group.title}</h3>
          <div className="fields-grid">
            {group.fields.map((field) => {
              const status = getValidationStatus(validation, field.key);
              const confidence = fieldConfidence?.[field.key];

              return (
                <label className={`field-control ${field.wide ? "field-wide" : ""}`} key={field.key}>
                  <span>
                    {field.label}
                    {status ? <StatusPill status={status} /> : null}
                  </span>
                  {field.type === "select" ? (
                    <select value={fields[field.key] ?? ""} onChange={(event) => onFieldChange(field.key, event.target.value)}>
                      <option value="">Unknown</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={fields[field.key] ?? ""}
                      onChange={(event) => onFieldChange(field.key, event.target.value.toUpperCase())}
                    />
                  )}
                  {confidence ? <small>{confidence}% field confidence</small> : null}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

export default FieldEditor;
