import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { qpSchemas } from "lib";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { eq } from "drizzle-orm";
import environment from "@/config/environment.ts";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res:any) => {
        const parsed = qpSchemas.requestIdSchema.parse({
            requestId: Number(req.params.requestId),
        });

        const requestId = parsed.requestId;

        // Query the QP review request with related file IDs
        const request = await db.query.qpReviewRequests.findFirst({
            where: eq(qpReviewRequests.id, requestId),
            columns: {
                id: true,
                midSemFilePath: true,
                midSemSolFilePath: true,
                compreFilePath: true,
                compreSolFilePath: true,
            },
        });

        if (!request) {
             return res.status(404).json({
                success: false,
                message: "QP review request not found",
             })
        }

        const fileIds = {
            midSem: request.midSemFilePath ?? null,
            midSemSol: request.midSemSolFilePath ?? null,
            compre: request.compreFilePath ?? null,
            compreSol: request.compreSolFilePath ?? null,
        };

        const validFileIds = Object.values(fileIds).filter(
            Boolean
        ) as number[];

        if (validFileIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No files found",
                data: [],
            });
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
