import vision from "@google-cloud/vision";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let cachedClient;
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function resolveCredentialPath(pathValue) {
  return isAbsolute(pathValue) ? pathValue : resolve(backendRoot, pathValue);
}

function buildClientOptions() {
  const options = {};

  if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
    options.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  }

  if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    try {
      options.credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON);
    } catch {
      const error = new Error("GOOGLE_CLOUD_CREDENTIALS_JSON is not valid JSON.");
      error.statusCode = 500;
      throw error;
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    options.keyFilename = resolveCredentialPath(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  return options;
}

export function getVisionClient() {
  if (!cachedClient) {
    cachedClient = new vision.ImageAnnotatorClient(buildClientOptions());
  }

  return cachedClient;
}
