import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileScan, ShieldCheck, Sparkles } from "lucide-react";
import CameraCapture from "../components/CameraCapture.jsx";
import Dropzone from "../components/Dropzone.jsx";
import ImagePreview from "../components/ImagePreview.jsx";
import PrivacyNotice from "../components/PrivacyNotice.jsx";
import ProcessingSkeleton from "../components/ProcessingSkeleton.jsx";
import { useExtraction } from "../hooks/useExtractionState.jsx";
import { useToast } from "../hooks/useToast.jsx";
import { isAcceptedImage, readFileAsDataUrl } from "../utils/fileUtils.js";

function UploadPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { runExtraction, isProcessing, progress, stage, currentResult } = useExtraction();
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [source, setSource] = useState("upload");

  const handleFileSelected = async (file) => {
    if (!isAcceptedImage(file)) {
      notify({
        type: "warning",
        title: "Unsupported file",
        message: "Use a JPG, PNG, WEBP, or BMP image."
      });
      return;
    }

    try {
      const preview = await readFileAsDataUrl(file);
      setSelectedFile(file);
      setImagePreview(preview);
      setSource("upload");
    } catch (error) {
      notify({ type: "warning", title: "Preview failed", message: error.message });
    }
  };

  const handleCameraCapture = ({ file, dataUrl }) => {
    setSelectedFile(file);
    setImagePreview(dataUrl);
    setSource("camera");
    notify({ type: "success", title: "Image captured", message: "Camera frame is ready for extraction." });
  };

  const handleRunExtraction = async () => {
    if (!selectedFile || !imagePreview) {
      notify({ type: "warning", title: "Image required", message: "Add a passport image before extraction." });
      return;
    }

    await runExtraction({ file: selectedFile, imagePreview, source });
    navigate("/results");
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setImagePreview("");
    setSource("upload");
  };

  return (
    <div className="page-stack upload-page">
      <section className="workspace-hero">
        <div className="hero-copy">
          <span className="eyebrow">Secure document extraction</span>
          <h1>Passport OCR, validation, and export in one local workspace.</h1>
          <p>
            Upload a passport bio-page image, review the simulated extraction, edit fields, and export clean JSON or CSV without sending
            the document anywhere.
          </p>
        </div>
        <div className="hero-stats" aria-label="Application highlights">
          <span>
            <ShieldCheck size={18} aria-hidden="true" />
            Local only
          </span>
          <span>
            <Sparkles size={18} aria-hidden="true" />
            Simulated AI checks
          </span>
          <span>
            <FileScan size={18} aria-hidden="true" />
            Editable OCR fields
          </span>
        </div>
      </section>

      <PrivacyNotice />

      <div className="upload-layout">
        <div className="upload-column">
          <Dropzone onFileSelected={handleFileSelected} selectedFile={selectedFile} disabled={isProcessing} />
          <CameraCapture onCapture={handleCameraCapture} />
        </div>

        <div className="review-column">
          <ImagePreview imagePreview={imagePreview} file={selectedFile} onClear={clearSelection} />

          <section className="action-panel">
            <div>
              <span className="eyebrow">Ready state</span>
              <h2>{selectedFile ? "Document image loaded" : "Waiting for image"}</h2>
              <p>
                {selectedFile
                  ? "Extraction will create structured passport fields, validation badges, a face/name score, and a QR payload."
                  : "Choose an upload or camera capture to begin the workflow."}
              </p>
            </div>
            <button className="primary-button wide" type="button" onClick={handleRunExtraction} disabled={!selectedFile || isProcessing}>
              Run extraction
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            {currentResult ? (
              <button className="icon-text-button subtle wide" type="button" onClick={() => navigate("/results")}>
                View latest results
              </button>
            ) : null}
          </section>

          {isProcessing ? <ProcessingSkeleton progress={progress} stage={stage} /> : null}
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
