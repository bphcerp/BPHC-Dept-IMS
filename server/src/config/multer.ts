import multer from "multer";
import { FILES_DIR } from "./environment.ts";
import { HttpCode, HttpError } from "./errors.ts";

const storage = multer.diskStorage({
    destination: FILES_DIR,
});

const pdfUpload = multer({
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

const imageUpload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 1, // 1 MB
    },
    fileFilter(_req, file, callback) {
        if (!["image/jpeg", "image/png", "image/jpg"].includes(file.mimetype)) {
            return callback(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Only JPEG or PNG images are allowed"
                )
            );
        }
        callback(null, true);
    },
});

export { pdfUpload, imageUpload };
