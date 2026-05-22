import { LockKeyhole, WifiOff } from "lucide-react";

function PrivacyNotice() {
  return (
    <aside className="privacy-notice" aria-label="Privacy notice">
      <LockKeyhole size={18} aria-hidden="true" />
      <div>
        <strong>Privacy-first client-side processing</strong>
        <span>No files are uploaded. OCR, validation, history, exports, camera capture, and QR generation run in the browser.</span>
      </div>
      <WifiOff size={18} aria-hidden="true" />
    </aside>
  );
}

export default PrivacyNotice;
