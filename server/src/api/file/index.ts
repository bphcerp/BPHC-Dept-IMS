import express from "express";
import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import env from "@/config/environment.ts";
const router = express.Router();

router.get(
    "/:id",
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));
        }

        const file = await db.query.files.findFirst({
            where: (file) => eq(file.id, id),
        });
        if (!file) {
            return next(new HttpError(HttpCode.NOT_FOUND, "File not found"));
        }

        const serverUrlObj = new URL(env.SERVER_URL);

        const httpUrl = `http://${serverUrlObj.hostname}:*`;
        const httpsUrl = `https://${serverUrlObj.hostname}:*`;

        res.setHeader(
            "Content-Security-Policy",
            `frame-ancestors 'self' ${httpUrl} ${httpsUrl}`
        );

        res.setHeader("content-type", file.mimetype ?? "application/pdf");
        if (file.size !== null) {
            res.setHeader("content-length", file.size);
        }
        if (file.originalName !== null) {
            res.setHeader(
                "content-disposition",
                `inline; filename="${file.originalName}"`
            );
        }
        const stream = fs.createReadStream(file.filePath);
        stream.once("error", (err) => {
            stream.destroy();
            next(new HttpError(HttpCode.NOT_FOUND, "File not found"));
        });
        stream.pipe(res);
);

export default router;
