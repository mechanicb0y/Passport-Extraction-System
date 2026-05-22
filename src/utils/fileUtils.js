export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp"];

export function isAcceptedImage(file) {
  return Boolean(file && ACCEPTED_IMAGE_TYPES.includes(file.type));
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read file preview."));
    reader.readAsDataURL(file);
  });
}

export function dataUrlToFile(dataUrl, fileName = "camera-passport.png") {
  const [metadata, content] = dataUrl.split(",");
  const mimeMatch = metadata.match(/:(.*?);/);
  const mimeType = mimeMatch?.[1] ?? "image/png";
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeType, lastModified: Date.now() });
}

export function formatBytes(bytes = 0) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** sizeIndex;

  return `${value.toFixed(value >= 10 || sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}
