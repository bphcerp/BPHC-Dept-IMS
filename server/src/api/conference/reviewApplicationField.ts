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
import { eq } from "drizzle-orm";
import { conferenceSchemas } from "lib";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.post(
    "/:type/:id",
    checkAccess("drc-manage-conference-application"),
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));
        }

        const rawType = req.params.type;
        const type = conferenceSchemas.fieldTypes.parse(rawType);

        const { comments, status } =
            conferenceSchemas.reviewFieldBodySchema.parse(req.body);

        const user = await db.query.users.findFirst({
            where: (user) => eq(user.email, req.user!.email),
        });

        if (!user) {
            return next(new HttpError(HttpCode.NOT_FOUND, "User not found"));
        }

        const topRole = await db.query.roles.findFirst({
            where: (role) => eq(role.id, user.roles[0]),
        });

        const value = {
            comments: comments,
            status: status,
            updatedAs: topRole ? topRole.roleName : "Unknown",
            textField: id,
            numberField: id,
            dateField: id,
            fileField: id,
            userEmail: user.email,
        };

        switch (type) {
            case "text":
                await db.insert(textFieldStatus).values(value);
                break;

            case "number":
                await db.insert(numberFieldStatus).values(value);
                break;

            case "date":
                await db.insert(dateFieldStatus).values(value);
                break;

            case "file":
                await db.insert(fileFieldStatus).values(value);
                break;

            default:
                return next(
                    new HttpError(HttpCode.BAD_REQUEST, "Invalid field type")
                );
        }

        res.status(200).send();
    })
);

export default router;
