import { Camera, CameraOff, ScanLine } from "lucide-react";
import { useCamera } from "../hooks/useCamera.js";

function CameraCapture({ onCapture }) {
  const { videoRef, isCameraOpen, cameraError, startCamera, stopCamera, captureFrame } = useCamera();

  const handleCapture = () => {
    const capture = captureFrame();

    if (capture) {
      onCapture(capture);
      stopCamera();
    }
  };

  return (
    <section className="camera-panel">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Camera capture</span>
          <h2>Capture from device camera</h2>
        </div>
        <div className="toolbar-row">
          {!isCameraOpen ? (
            <button className="icon-text-button" type="button" onClick={startCamera}>
              <Camera size={17} aria-hidden="true" />
              Open camera
            </button>
          ) : (
            <button className="icon-text-button subtle" type="button" onClick={stopCamera}>
              <CameraOff size={17} aria-hidden="true" />
              Close
            </button>
          )}
        </div>
      </div>

      <div className="camera-stage">
        <video ref={videoRef} className={isCameraOpen ? "is-active" : ""} playsInline muted aria-label="Camera preview" />
        {!isCameraOpen ? (
          <div className="camera-placeholder">
            <ScanLine size={30} aria-hidden="true" />
            <span>Camera preview appears here after permission is granted.</span>
          </div>
        ) : null}
      </div>

      {cameraError ? <p className="inline-error">{cameraError}</p> : null}

      {isCameraOpen ? (
        <button className="primary-button wide" type="button" onClick={handleCapture}>
          <Camera size={18} aria-hidden="true" />
          Capture image
        </button>
      ) : null}
    </section>
  );
}

export default CameraCapture;
