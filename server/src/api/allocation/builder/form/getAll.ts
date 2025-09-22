import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { semester } from "@/config/db/schema/allocation.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { checkNewSemesterValidity } = req.query;

        const forms = await db.query.allocationForm.findMany({
            with: {
                createdBy: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
                template: {
                    columns: {
                        id: true,
                        name: true,
                    },
                },
            },
            where:
                checkNewSemesterValidity === "true"
                    ? (allocationForm, { eq, notExists }) =>
                          notExists(
                              db
                                  .select({ id: semester.id })
                                  .from(semester)
                                  .where(eq(semester.formId, allocationForm.id))
                          )
                    : undefined,
        });
        res.status(200).json(forms);
    })
);

export default router;
