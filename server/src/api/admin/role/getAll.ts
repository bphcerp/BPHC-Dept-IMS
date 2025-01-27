import { asyncHandler } from "@/middleware/routeHandler";
import assert from "assert";
import express from "express";
import { checkAccess } from "@/middleware/auth";
import db from "@/config/db";
const router = express.Router();

router.get(
    "/",
    checkAccess("role:read"),
    asyncHandler(async (req, res, _) => {
        assert(req.user);

        const allRoles = await db.query.roles.findMany();
        res.json(allRoles.map((x) => x.role));
    })
);

export default router;
