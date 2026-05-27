import { Cloud, LockKeyhole } from "lucide-react";

function PrivacyNotice() {
  return (
    <aside className="privacy-notice" aria-label="Privacy notice">
      <LockKeyhole size={18} aria-hidden="true" />
      <div>
        <strong>Privacy-first OCR workflow</strong>
        <span>Images go to your backend, which calls Google Vision OCR. History, exports, camera capture, and QR generation stay in the browser.</span>
      </div>
      <Cloud size={18} aria-hidden="true" />
    </aside>
  );
}

export default PrivacyNotice;
