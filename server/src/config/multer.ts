import multer from "multer";
import { FILES_DIR } from "./environment.ts";
import { HttpCode, HttpError } from "./errors.ts";
import sharp from "sharp";
import path from "path";
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

const storage = multer.diskStorage({
    destination: FILES_DIR,
});

export const pdfLimits = {
    fileSize: 1024 * 1024 * 2, 
};

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

export const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 1,
    },
    fileFilter: (_req: Request, file, callback) => {
        if (
            !["image/png", "image/webp", "image/jpeg"].includes(file.mimetype)
        ) {
            return callback(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Invalid mimetype (found: " +
                        file.mimetype +
                        " - expected: image/png or image/webp"
                )
            );
        }
        callback(null, true);
    },
});

export const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 5, // 5 MB
    },
    fileFilter(_req, file, callback) {
        const allowedMimeTypes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "application/csv",
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Only Excel (.xlsx, .xls) or CSV files are allowed"
                )
            );
        }
        callback(null, true);
    },
});

export const validateDimensionsAndSaveMiddleware =
    (width: number, height: number) =>
    async (req: Request, _res: Response, next: NextFunction) => {
        if (!req.file) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Missing file"));
        }
        const filename = crypto.randomBytes(16).toString("hex");
        const filePath = path.join(FILES_DIR, filename);
        const saved = await sharp(req.file.buffer)
            .resize(width, height, {
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
