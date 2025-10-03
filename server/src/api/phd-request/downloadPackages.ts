// server/src/api/phd-request/downloadPackages.ts

import express from "express";
import JSZip from "jszip";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { HttpError, HttpCode } from "@/config/errors.ts";
import fs from "fs/promises";


const router = express.Router();

const downloadPackagesSchema = z.object({
    requestIds: z.array(z.number().int().positive()).min(1),
});

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { requestIds } = downloadPackagesSchema.parse(req.body);

        const requestsToPackage = await db.query.phdRequests.findMany({
            where: inArray(phdRequests.id, requestIds),
            with: {
                student: { columns: { name: true } },
                documents: {
                    with: {
                        file: {
                            columns: { originalName: true, filePath: true },
                        },
                    },
                },
            },
        });

        if (requestsToPackage.length === 0) {
            throw new HttpError(
                HttpCode.NOT_FOUND,
                "No valid requests found for the given IDs."
            );
        }

        const zip = new JSZip();

        for (const request of requestsToPackage) {
            if (!request.student.name) continue;

            const folderName = `${request.student.name} - ${request.requestType
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}`;

            const folder = zip.folder(folderName);

            if (folder) {
                for (const doc of request.documents) {
                    if (doc.file && doc.file.filePath) {
                        try {
                            const fileContent = await fs.readFile(
                                doc.file.filePath
                            );
                            const fileName = `${doc.documentType}-${doc.file.originalName}`;
                            folder.file(fileName, fileContent);
                        } catch (error) {
                            console.error(
                                `Could not read file to zip: ${doc.file.filePath}`,
                                error
                            );
                            // Add a text file indicating the error for this specific file
                            folder.file(
                                `ERROR-reading-${doc.file.originalName}.txt`,
                                `Could not find or read the file at path: ${doc.file.filePath}`
                            );
                        }
                    }
                }
            }
        }

        const zipBuffer = await zip.generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE",
            compressionOptions: {
                level: 9,
            },
        });

        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="phd-request-packages.zip"'
        );
        res.send(zipBuffer);
    })
);

export default router;
