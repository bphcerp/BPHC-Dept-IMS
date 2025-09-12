import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const formId = req.params.formId;

        const forms = await db.query.allocationFormResponse.findMany({
            where: (fr, { eq }) => eq(fr.formId, formId),
            with: {
                values: {
                    with: {
                        answers: {
                            with: {
                                option: true,
                            },
                        },
                        field: true,
                    },
                },
                submittedBy: true,
            },
            columns: {
                submittedByEmail: false,
            },
        });
        res.status(200).json(forms);
    })
);

export default router;
