import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/by-email",
    asyncHandler(async (req, res, _next) => {
        const { email } = req.query;
        if (!email || typeof email !== "string") {
            res.status(400).json({
                success: false,
                error: "Email is required",
            });
            return;
        }
        const searchUsers = await db.query.users.findMany({
            where: (cols, { ilike }) => ilike(cols.email, `%${email}%`),
            columns: {
                email: true,
            },
            with: {
                faculty: {
                    columns: {
                        name: true,
                        department: true,
                        designation: true,
                        room: true,
                        phone: true,
                    },
                },
            },
            limit: 5,
        });
        if (searchUsers.length <= 0) {
            res.status(404).json({
                success: false,
                error: "No users found",
            });
            return;
        }
        const parsedUsers = searchUsers.map((user) => {
            return {
                email: user.email,
                name: user.faculty?.name || "",
                department: user.faculty?.department || "",
                designation: user.faculty?.designation || "",
                room: user.faculty?.room || "",
                phone: user.faculty?.phone || "",
            };
        });
        res.status(200).json({
            success: true,
            suggestions: parsedUsers,
        });
    })
);

router.get(
    "/by-name",
    asyncHandler(async (req, res, _next) => {
        const { name } = req.query;
        if (!name || typeof name !== "string") {
            res.status(400).json({
                success: false,
                error: "Name is required",
            });
            return;
        }
        const searchUsers = await db.query.users.findMany({
            where: (cols, { ilike }) => ilike(cols.name, `%${name}%`),
            columns: {
                name: true,
            },
            with: {
                faculty: {
                    columns: {
                        email: true,
                        name: true,
                        department: true,
                        designation: true,
                        room: true,
                        phone: true,
                    },
                },
            },
            limit: 5,
        });
        if (searchUsers.length <= 0) {
            res.status(404).json({
                success: false,
                error: "No users found",
            });
            return;
        }
        const parsedUsers = searchUsers.map((user) => {
            return {
                email: user.faculty.email,
                name: user.faculty?.name || "",
                department: user.faculty?.department || "",
                designation: user.faculty?.designation || "",
                room: user.faculty?.room || "",
                phone: user.faculty?.phone || "",
            };
        });
        res.status(200).json({
            success: true,
            suggestions: parsedUsers,
        });
    })
);

export default router;
