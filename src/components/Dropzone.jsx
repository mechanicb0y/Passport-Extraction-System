import { useRef, useState } from "react";
import { FileImage, UploadCloud } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, formatBytes, MAX_IMAGE_SIZE_BYTES } from "../utils/fileUtils.js";

function Dropzone({ onFileSelected, selectedFile, disabled = false }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <section
      className={`dropzone ${isDragging ? "is-dragging" : ""} ${disabled ? "is-disabled" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={(event) => handleFiles(event.target.files)}
        disabled={disabled}
        aria-label="Upload passport image"
      />
      <span className="dropzone-icon" aria-hidden="true">
        <UploadCloud size={32} />
      </span>
      <div>
        <h2>Drop passport image here</h2>
        <p>JPG, PNG, WEBP, or BMP up to {formatBytes(MAX_IMAGE_SIZE_BYTES)}. Processing stays in this browser.</p>
      </div>
      {selectedFile ? (
        <div className="selected-file">
          <FileImage size={16} aria-hidden="true" />
          <span>{selectedFile.name}</span>
          <small>{formatBytes(selectedFile.size)}</small>
        </div>
      ) : null}
      {!selectedFile ? <small className="file-hint">Click or drag a clear bio-page image.</small> : null}
    </section>
  );
}

export default Dropzone;
