import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
const router = express.Router({ mergeParams: true });

router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const formId = req.params.id;

        const forms = await db.query.allocationFormResponse.findMany({
            where: (fr, { eq }) => eq(fr.formId, formId),
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
                submittedByEmail: false,
            },
        });
        res.status(200).json(forms);
    })
);

export default router;
