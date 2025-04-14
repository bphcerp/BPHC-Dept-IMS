import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { qpSchemas } from "lib";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { eq } from "drizzle-orm";
import environment from "@/config/environment.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.get(
    "/:requestId",
    asyncHandler(async (req, res, next) => {
        // Parse and validate requestId
        const parsed = qpSchemas.requestIdSchema.parse({
            requestId: Number(req.params.requestId),
        });

        const requestId = parsed.requestId;

        const request = await db.query.qpReviewRequests.findFirst({
            where: eq(qpReviewRequests.id, requestId),
            columns: {
                id: true,
            },
            with: {
                midSemFile: { columns: { fileId: true } },
                midSemSolFile: { columns: { fileId: true } },
                compreFile: { columns: { fileId: true } },
                compreSolFile: { columns: { fileId: true } },
            },
        });

        if (!request) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "QP review request not found")
            );
        }

        // Map file IDs with their respective keys

        const fileIds = {
            midSem: request?.midSemFile?.fileId ?? null,
            midSemSol: request?.midSemSolFile?.fileId ?? null,
            compre: request?.compreFile?.fileId ?? null,
            compreSol: request?.compreSolFile?.fileId ?? null,
        };

        // Filter out null values
        const validFileIds = Object.values(fileIds).filter(
            Boolean
        ) as unknown as number[];

        if (validFileIds.length === 0) {
            res.status(200).json({
                success: true,
                message: "No files found",
                data: [],
            });
            return;
        }

        const SERVER_URL = environment.SERVER_URL;
        const fileUrls = Object.fromEntries(
            Object.entries(fileIds).map(([key, id]) => [
                key,
                id ? `${SERVER_URL}/f/${id}` : null,
            ])
        );

        res.status(200).json({
            success: true,
            message: "Files retrieved successfully",
            data: fileUrls,
        });
    })
);

export default router;
