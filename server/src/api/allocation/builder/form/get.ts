import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { getLatestSemesterMinimal } from "../../semester/getLatest.ts";
const router = express.Router();

router.get(
    "/:id",
    checkAccess("allocation:form:response:submit"),
    asyncHandler(async (req, res, next) => {
        let { id } = req.params;
        const { checkUserResponse } = req.query;

        if (id === 'latest') {
            const latestSem = await getLatestSemesterMinimal();
            if (!latestSem)
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "No semester found to fetch latest form"
                    )
                );

            if (!latestSem.formId){
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "No form found for latest semester"
                    )
                );
            }

            id = latestSem.formId;
        }

        let form = await db.query.allocationForm.findFirst({
            columns: {
                templateId: false,
            },
            with: {
                template: {
                    with: {
                        fields: {
                            with: {
                                group: true,
                            },
                        },
                    },
                },
                createdBy: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
            },
            where: (form, { eq }) => eq(form.id, id),
        });

        if (!form)
            return next(new HttpError(HttpCode.NOT_FOUND, "Form not found"));

        const { roles: userRoles } = (await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, req.user!.email),
            columns: {
                roles: true,
            },
        }))!;

        const userPermsSet = new Set(req.user?.permissions.allowed);

        form.template.fields = form.template.fields.filter((field) => {
            if (
                !field.viewableByRoleId ||
                userPermsSet.has("*") ||
                userPermsSet.has("allocation:form:response:view") ||
                userPermsSet.has("allocation:write")
            )
                return true;
            return userRoles.includes(field.viewableByRoleId);
        });

        let userAlreadyResponded;

        if (checkUserResponse === "true")
            userAlreadyResponded = (
                await db.query.allocationFormResponse.findFirst({
                    where: (formResponse, { eq, and }) =>
                        and(
                            eq(formResponse.formId, form.id),
                            eq(formResponse.submittedByEmail, req.user!.email)
                        ),
                })
            )?.id;

        res.status(200).json({
            ...form,
            ...(checkUserResponse === "true"
                ? {
                      userAlreadyResponded,
                  }
                : {}),
        });
    })
);

export default router;
