import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.post(
        "/:id",
        asyncHandler(async (req, res, next) => {
                const id = parseInt(req.params.id);
                if (isNaN(id) || id <= 0)
                        return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));

                res.status(200).send();
        })
);

export default router;

