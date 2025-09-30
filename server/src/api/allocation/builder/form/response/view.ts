import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const responseId = req.params.id;

        const formResponseWithDetails =
            await db.query.allocationFormResponse.findFirst({
                where: (fr, { eq }) => eq(fr.id, responseId),
                with: {
                    course: {
                        columns: {
                            name: true,
                            code: true,
                        },
                    },
                    templateField: true,
                    submittedBy: {
                        columns: {
                            name: true,
                            email: true,
                            type: true,
                        },
                    },
                },
                columns: {
                    courseCode: false,
                    templateFieldId: false,
                    submittedByEmail: false,
                },
            });

        if (!formResponseWithDetails) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "Allocation form response not found"
                )
            );
        }

        res.status(200).json(formResponseWithDetails);
    })
);

export default router;
