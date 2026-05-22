import { FileX2, Image as ImageIcon } from "lucide-react";
import { formatBytes } from "../utils/fileUtils.js";

function ImagePreview({ imagePreview, file, onClear, compact = false }) {
  if (!imagePreview) {
    return (
      <div className={`preview-empty ${compact ? "compact" : ""}`}>
        <ImageIcon size={24} aria-hidden="true" />
        <span>No image selected</span>
      </div>
    );
  }

  return (
    <section className={`image-preview ${compact ? "compact" : ""}`} aria-label="Passport image preview">
      <div className="preview-frame">
        <img src={imagePreview} alt="Selected passport document preview" />
      </div>
      <div className="preview-meta">
        <div>
          <strong>{file?.name ?? "Camera capture"}</strong>
          <span>{file?.size ? formatBytes(file.size) : "Captured image"}</span>
        </div>
        {onClear ? (
          <button className="icon-text-button subtle" type="button" onClick={onClear}>
            <FileX2 size={17} aria-hidden="true" />
            Remove
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default ImagePreview;
