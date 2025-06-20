import multer from "multer";
import { FILES_DIR } from "./environment.ts";
import { HttpCode, HttpError } from "./errors.ts";
import sharp from "sharp";
import path from "path";
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import logger from "./logger.ts";

const storage = multer.diskStorage({
    destination: FILES_DIR,
});

export const pdfUpload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 2, // 2 MB
    },
    fileFilter(_req, file, callback) {
        if (file.mimetype !== "application/pdf") {
            return callback(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Only PDF files are allowed"
                )
            );
        }
        callback(null, true);
    },
});

export const signatureUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 1,
    },
    fileFilter: (_req: Request, file, callback) => {
        if (!["image/png", "image/webp"].includes(file.mimetype)) {
            return callback(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Only PNG images are allowed"
                )
            );
        }
        callback(null, true);
    },
});

export const validateAndSaveSignatureMiddleware = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next();
    }
    const metadata = await sharp(req.file.buffer).metadata();
    const widthValid = metadata.width === 150;
    const heightValid = metadata.height === 60;
    if (!widthValid || !heightValid)
        logger.debug(
            `Invalid image dimensions: ${metadata.width}x${metadata.height}. Expected 150x60.`
        );
    const filename = crypto.randomBytes(16).toString("hex");
    const filePath = path.join(FILES_DIR, filename);
    const saved = await sharp(req.file.buffer)
        .resize(150, 60, {
            fit: "fill",
            kernel: sharp.kernel.lanczos3,
        })
        .png({ quality: 100 })
        .toFile(filePath);
    const extendedFile = req.file;
    extendedFile.filename = filename;
    extendedFile.path = filePath;
    extendedFile.destination = FILES_DIR;
    extendedFile.size = saved.size;
    next();
};
