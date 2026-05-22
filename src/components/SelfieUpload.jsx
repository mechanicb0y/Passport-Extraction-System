import { useState } from "react";
import { Upload, UserRound, X } from "lucide-react";
import { formatBytes, isAcceptedImage, isWithinImageSizeLimit, readFileAsDataUrl } from "../utils/fileUtils.js";

function SelfieUpload({ onError }) {
  const [selfie, setSelfie] = useState(null);
  const [preview, setPreview] = useState("");

  const handleSelfie = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isAcceptedImage(file)) {
      onError?.("Use a JPG, PNG, WEBP, or BMP selfie image.");
      return;
    }

    if (!isWithinImageSizeLimit(file)) {
      onError?.("Selfie image must be 5MB or smaller.");
      return;
    }

    setSelfie(file);
    setPreview(await readFileAsDataUrl(file));
  };

  const clearSelfie = () => {
    setSelfie(null);
    setPreview("");
  };

  return (
    <section className="selfie-panel">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Optional selfie</span>
          <h2>Upload selfie</h2>
        </div>
        <UserRound size={20} aria-hidden="true" />
      </div>

      {preview ? (
        <div className="selfie-preview">
          <img src={preview} alt="Uploaded selfie preview" />
          <div>
            <strong>{selfie.name}</strong>
            <span>{formatBytes(selfie.size)}</span>
          </div>
          <button className="icon-button danger" type="button" onClick={clearSelfie} aria-label="Remove selfie">
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label className="selfie-upload-control">
          <Upload size={18} aria-hidden="true" />
          <span>Add selfie image</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/bmp" onChange={handleSelfie} />
        </label>
      )}
    </section>
  );
}

export default SelfieUpload;
