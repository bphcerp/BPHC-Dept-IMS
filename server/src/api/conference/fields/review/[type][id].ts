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

        let fieldStatusQuery, fieldStatus, fieldStatusCol;

        switch (type) {
            case "text":
                fieldStatusQuery = db.query.textFieldStatus;
                fieldStatus = textFieldStatus;
                fieldStatusCol = textFieldStatus.textField;
                break;
            case "number":
                fieldStatusQuery = db.query.numberFieldStatus;
                fieldStatus = numberFieldStatus;
                fieldStatusCol = numberFieldStatus.numberField;
                break;
            case "date":
                fieldStatusQuery = db.query.dateFieldStatus;
                fieldStatus = dateFieldStatus;
                fieldStatusCol = dateFieldStatus.dateField;
                break;
            case "file":
                fieldStatusQuery = db.query.fileFieldStatus;
                fieldStatus = fileFieldStatus;
                fieldStatusCol = fileFieldStatus.fileField;
                break;
            default:
                return next(
                    new HttpError(HttpCode.BAD_REQUEST, "Invalid field type")
                );
        }

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
            if (latestStatus.status && status)
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Field is already approved"
                    )
                );

            if (!latestStatus.status && !status)
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Field is already rejected"
                    )
                );

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

        await db.insert(fieldStatus).values(value);
        if (status && (await areAllFieldsApprovedForApplication(applId))) {
            await db
                .update(conferenceApprovalApplications)
                .set({
                    state: conferenceSchemas.states[1],
                })
                .where(
                    eq(conferenceApprovalApplications.applicationId, applId)
                );
        } else if (!status) {
            await db
                .update(conferenceApprovalApplications)
                .set({
                    state: conferenceSchemas.states[0],
                })
                .where(
                    eq(conferenceApprovalApplications.applicationId, applId)
                );
        }

        res.status(200).send();
    })
);

export default router;
