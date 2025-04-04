import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import {
    textFieldStatus,
    numberFieldStatus,
    dateFieldStatus,
    fileFieldStatus,
} from "@/config/db/schema/form.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { authUtils, conferenceSchemas } from "lib";
import { checkAccess } from "@/middleware/auth.ts";
import { eq } from "drizzle-orm";
import { areAllFieldsApprovedForApplication } from "@/lib/conference/index.ts";
import { conferenceApprovalApplications } from "@/config/db/schema/conference.ts";

const router = express.Router();

router.post(
    "/:type/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));

        const rawType = req.params.type;
        const type = conferenceSchemas.fieldTypes.parse(rawType);

        const applId = parseInt(req.query.applId as string);
        if (isNaN(applId) || applId <= 0)
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Invalid application id")
            );

        const { comments, status } =
            conferenceSchemas.reviewFieldBodySchema.parse(req.body);

        const value = {
            comments: comments,
            status: status,
            updatedAs: "member",
            textField: id,
            numberField: id,
            dateField: id,
            fileField: id,
            userEmail: req.user!.email,
        };

        const fieldStatusQuery =
            type === "text"
                ? db.query.textFieldStatus
                : type === "number"
                  ? db.query.numberFieldStatus
                  : type === "date"
                    ? db.query.dateFieldStatus
                    : type === "file"
                      ? db.query.fileFieldStatus
                      : null;
        if (!fieldStatusQuery)
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Invalid field type")
            );

        const fieldStatus =
            type === "text"
                ? textFieldStatus
                : type === "number"
                  ? numberFieldStatus
                  : type === "date"
                    ? dateFieldStatus
                    : fileFieldStatus;
        const fieldStatusCol =
            type === "text"
                ? textFieldStatus.textField
                : type === "number"
                  ? numberFieldStatus.numberField
                  : type === "date"
                    ? dateFieldStatus.dateField
                    : fileFieldStatus.fileField;

        const latestStatus = await fieldStatusQuery.findFirst({
            columns: {
                status: true,
                userEmail: true,
                comments: true,
            },
            where: eq(fieldStatusCol, id),
            orderBy: (cols, { desc }) => desc(cols.timestamp),
        });

        if (latestStatus) {
            if (latestStatus.status && status) {
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Field is already approved"
                    )
                );
            }
            if (
                !authUtils.checkAccess(
                    "conference:application:overwrite-field-review",
                    req.user!.permissions
                ) &&
                latestStatus.userEmail !== req.user!.email
            )
                return next(
                    new HttpError(
                        HttpCode.FORBIDDEN,
                        "You do not have permission to overwrite a previous review"
                    )
                );
        }

        await db.transaction(async (tx) => {
            await tx.insert(fieldStatus).values(value);
            if (status && (await areAllFieldsApprovedForApplication(applId))) {
                await tx
                    .update(conferenceApprovalApplications)
                    .set({
                        state: conferenceSchemas.states[1],
                    })
                    .where(
                        eq(conferenceApprovalApplications.applicationId, applId)
                    );
            }
        });

        res.status(200).send();
    })
);

export default router;
