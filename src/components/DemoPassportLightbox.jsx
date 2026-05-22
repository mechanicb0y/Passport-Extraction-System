import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { demoPassportPreview } from "../data/demoPassport.js";

function DemoPassportLightbox({ isOpen, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = Array.from(
        document.querySelectorAll(
          ".lightbox-dialog button, .lightbox-dialog [href], .lightbox-dialog input, .lightbox-dialog select, .lightbox-dialog textarea, .lightbox-dialog [tabindex]:not([tabindex='-1'])"
        )
      );

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="lightbox-backdrop" onMouseDown={onClose}>
      <section
        className="lightbox-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-passport-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="lightbox-header">
          <div>
            <span className="eyebrow">Example passport</span>
            <h2 id="demo-passport-title">Sample passport preview</h2>
          </div>
          <button ref={closeButtonRef} className="icon-button" type="button" onClick={onClose} aria-label="Close example passport preview">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="lightbox-image-frame">
          <img src={demoPassportPreview} alt="Large preview of the example passport sample" />
        </div>
      </section>
    </div>
  );
}

export default DemoPassportLightbox;
