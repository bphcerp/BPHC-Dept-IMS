import express from "express";
import db from "@/config/db/index.ts";
import { allocationFormResponse } from "@/config/db/schema/allocationFormBuilder.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { allocationFormResponseSchema } from "node_modules/lib/src/schemas/AllocationFormBuilder.ts";
import { completeTodo } from "@/lib/todos/index.ts";
import assert from "assert";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        assert(req.user);
        const parsed = allocationFormResponseSchema.parse(req.body);
        const form = await db.query.allocationForm.findFirst({
            where: (f, { eq }) => eq(f.id, parsed.formId),
        });

        if (!form) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Form not found"));
        }

        if (!form.publishedDate) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Form not published")
            );
        }

        const formResponseExists =
            await db.query.allocationFormResponse.findFirst({
                where: (fr, { and, eq }) =>
                    and(
                        eq(fr.formId, parsed.formId),
                        eq(fr.submittedByEmail, req.user!.email)
                    ),
            });

        if (formResponseExists) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "You have already submitted a response for this form"
                )
            );
        }

        const { roles: userRoles } = (await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, req.user!.email),
            columns: {
                roles: true,
            },
        }))!;

        if (
            form.isPublishedToRoleId &&
            !userRoles?.includes(form.isPublishedToRoleId)) {
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "You do not have permission to submit this form"
                )
            );
        }

        const formSemester = await db.query.semester.findFirst({
            where: (s, { eq }) => eq(s.formId, form.id),
        });

        if (
            form.formDeadline &&
            formSemester &&
            formSemester.allocationStatus !== "formCollection" &&
            Date.now() > new Date(form.formDeadline).getTime()
        ) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Form Deadline is Over")
            );
        }

        await db.transaction(async (tx) => {
            const insertPromises = parsed.response.map((field) =>
                tx.insert(allocationFormResponse).values({
                    formId: parsed.formId,
                    submittedAt: new Date(),
                    submittedByEmail: req.user!.email,
                    ...field,
                })
            );
            await Promise.all(insertPromises);
            await completeTodo({
                module: "Course Allocation",
                completionEvent: `preference submission by ${req.user!.email}`,
            });
        });

        res.status(201).send({
            message: "Form response registered successfully",
        });
    })
);

export default router;
