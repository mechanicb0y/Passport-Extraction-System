function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:4000";
  }

  throw new Error("Production API URL is not configured. Set VITE_API_BASE_URL to the deployed backend URL.");
}

export async function extractPassportImage({ file, source = "upload" }) {
  const formData = new FormData();
  formData.append("passportImage", file);
  formData.append("source", source);

  const response = await fetch(`${getApiBaseUrl()}/api/extractions`, {
    method: "POST",
    body: formData
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error?.message || "Passport extraction failed.");
  }

  return payload.data ?? payload;
}
