import { Router } from "express";
import { extractPassport } from "../controllers/extraction.controller.js";
import { uploadPassportImage } from "../middleware/upload.middleware.js";

export const extractionRouter = Router();

extractionRouter.post("/", uploadPassportImage.single("passportImage"), extractPassport);
