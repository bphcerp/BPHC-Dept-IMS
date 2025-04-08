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
import { and, eq } from "drizzle-orm";
import {
    areAllFieldsApprovedForApplication,
    getApplicationById,
} from "@/lib/conference/index.ts";
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

        let fieldStatusQuery, fieldStatus, fieldStatusCol, fieldTableQuery;

        switch (type) {
            case "text":
                fieldStatusQuery = db.query.textFieldStatus;
                fieldStatus = textFieldStatus;
                fieldStatusCol = textFieldStatus.textField;
                fieldTableQuery = db.query.textFields;
                break;
            case "number":
                fieldStatusQuery = db.query.numberFieldStatus;
                fieldStatus = numberFieldStatus;
                fieldStatusCol = numberFieldStatus.numberField;
                fieldTableQuery = db.query.numberFields;
                break;
            case "date":
                fieldStatusQuery = db.query.dateFieldStatus;
                fieldStatus = dateFieldStatus;
                fieldStatusCol = dateFieldStatus.dateField;
                fieldTableQuery = db.query.dateFields;
                break;
            case "file":
                fieldStatusQuery = db.query.fileFieldStatus;
                fieldStatus = fileFieldStatus;
                fieldStatusCol = fileFieldStatus.fileField;
                fieldTableQuery = db.query.fileFields;
                break;
            default:
                return next(
                    new HttpError(HttpCode.BAD_REQUEST, "Invalid field type")
                );
        }

        const field = await fieldTableQuery.findFirst({
            where: (cols) => eq(cols.id, id),
        });

        if (!field)
            return next(new HttpError(HttpCode.NOT_FOUND, "Field not found"));

        const application = await getApplicationById(applId);
        if (
            !application ||
            !Object.values(application.conferenceApplication)
                .map((v) => (typeof v === "string" ? undefined : v?.id))
                .includes(id)
        )
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );
        if (application.status !== "pending")
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Application is already reviewed"
                )
            );

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
        if (status && (await areAllFieldsApprovedForApplication(application))) {
            await db
                .update(conferenceApprovalApplications)
                .set({
                    state: conferenceSchemas.states[1],
                })
                .where(
                    and(
                        eq(
                            conferenceApprovalApplications.applicationId,
                            applId
                        ),
                        eq(
                            conferenceApprovalApplications.state,
                            conferenceSchemas.states[0]
                        )
                    )
                );
        } else if (!status) {
            await db
                .update(conferenceApprovalApplications)
                .set({
                    state: conferenceSchemas.states[0],
                })
                .where(
                    and(
                        eq(conferenceApprovalApplications.applicationId, applId)
                    )
                );
        }

        res.status(200).send();
    })
);

export default router;
