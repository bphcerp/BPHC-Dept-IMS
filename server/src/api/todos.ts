import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { getUserDetails } from "@/lib/common/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import type { todosSchemas } from "lib";
const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res, next) => {
        if (!req.user) {
            return next(
                new HttpError(HttpCode.UNAUTHORIZED, "User not authenticated")
            );
        }
        const userDetails = await getUserDetails(req.user.email);
        if (!userDetails)
            return next(new HttpError(HttpCode.NOT_FOUND, "User not found"));

        const todos = (
            await db.query.todos.findMany({
                where: (cols, { eq }) => eq(cols.assignedTo, req.user!.email),
                orderBy: (cols, { desc }) => desc(cols.deadline),
            })
        ).map(({ completionEvent: _, ...todo }) => ({
            ...todo,
            createdAt: todo.createdAt.toLocaleString(),
            deadline: todo.deadline?.toLocaleString() ?? null,
        }));
        const response: todosSchemas.TodosResponseType = {
            todos,
            name: userDetails.name,
            roles: userDetails.roles,
        };
        res.status(HttpCode.OK).json(response);
    })
);

export default router;
