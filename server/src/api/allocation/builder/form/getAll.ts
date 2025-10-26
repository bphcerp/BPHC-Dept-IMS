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
                    with: {
                        faculty: { columns: { name: true } },
                        phd: { columns: { name: true } },
                        staff: { columns: { name: true } },
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
        res.status(200).json(forms.map((form) => ({
            ...form,
            createdBy: {
                ...form.createdBy,
                name: form.createdBy.name ?? form.createdBy.faculty.name ?? form.createdBy.staff.name ?? form.createdBy.phd.name
            }
        })));
    })
);

export default router;
