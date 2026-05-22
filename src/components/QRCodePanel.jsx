import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";
import { buildSafeFileName, downloadBlob } from "../utils/exportUtils.js";

function QRCodePanel({ result }) {
  const [qrUrl, setQrUrl] = useState("");
  const payload = JSON.stringify(result.qrPayload, null, 0);

  useEffect(() => {
    let isMounted = true;

    QRCode.toDataURL(payload, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#071a33",
        light: "#fff8df"
      }
    }).then((url) => {
      if (isMounted) {
        setQrUrl(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [payload]);

  const downloadQr = async () => {
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    downloadBlob(blob, buildSafeFileName(result, "qr.png"), "image/png");
  };

  return (
    <section className="qr-panel">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">QR payload</span>
          <h2>Verification code</h2>
        </div>
        <QrCode size={20} aria-hidden="true" />
      </div>
      {qrUrl ? <img src={qrUrl} alt="QR code for extracted passport JSON summary" /> : <div className="qr-loading" />}
      <button className="icon-text-button subtle" type="button" onClick={downloadQr} disabled={!qrUrl}>
        <Download size={17} aria-hidden="true" />
        Download QR
      </button>
    </section>
  );
}

export default QRCodePanel;
