import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractionRouter } from "./routes/extraction.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({ path: resolve(backendRoot, ".env"), quiet: true });

export function createApp() {
  const app = express();
  const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: corsOrigins.includes("*") ? true : corsOrigins,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"]
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "passport-extraction-backend",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/extractions", extractionRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const port = Number(process.env.PORT || 4000);
  createApp().listen(port, () => {
    console.log(`Passport extraction backend listening on http://localhost:${port}`);
  });
}
