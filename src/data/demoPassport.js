const demoPassportSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
  <rect width="900" height="560" rx="28" fill="#f7fbff"/>
  <rect x="36" y="36" width="828" height="488" rx="22" fill="#ffffff" stroke="#153b68" stroke-width="6"/>
  <rect x="36" y="36" width="828" height="86" rx="22" fill="#08203d"/>
  <text x="72" y="92" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#f5c84c">PASSPORT</text>
  <text x="690" y="92" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">UTO</text>
  <rect x="74" y="160" width="210" height="250" rx="18" fill="#dbeafe" stroke="#143b68" stroke-width="4"/>
  <circle cx="179" cy="242" r="54" fill="#abc1d8"/>
  <path d="M95 380c22-58 146-58 168 0" fill="#abc1d8"/>
  <g font-family="Arial, sans-serif" fill="#102033">
    <text x="330" y="176" font-size="18" font-weight="700">SURNAME</text>
    <text x="330" y="211" font-size="30" font-weight="700">CARTER</text>
    <text x="330" y="258" font-size="18" font-weight="700">GIVEN NAMES</text>
    <text x="330" y="293" font-size="30" font-weight="700">AMELIA ROSE</text>
    <text x="330" y="340" font-size="18" font-weight="700">PASSPORT NO.</text>
    <text x="330" y="375" font-size="30" font-weight="700">123456789</text>
    <text x="600" y="340" font-size="18" font-weight="700">EXPIRY</text>
    <text x="600" y="375" font-size="30" font-weight="700">2031-09-18</text>
  </g>
  <rect x="74" y="440" width="752" height="48" rx="8" fill="#eef4fb"/>
  <text x="94" y="471" font-family="Consolas, monospace" font-size="21" fill="#061427">P&lt;UTOCARTER&lt;&lt;AMELIA&lt;ROSE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
</svg>`;

export const demoPassportPreview = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(demoPassportSvg)}`;

export async function createDemoPassportFile() {
  const image = new Image();

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Unable to load demo passport image."));
    image.src = demoPassportPreview;
  });

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 560;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const preview = canvas.toDataURL("image/png", 0.95);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));

  if (!blob) {
    throw new Error("Unable to create demo passport file.");
  }

  return {
    file: new File([blob], "demo-passport.png", { type: "image/png", lastModified: Date.now() }),
    preview
  };
}
