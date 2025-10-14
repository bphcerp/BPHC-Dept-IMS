import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
  "/by-email",
  asyncHandler(async (req, res, _next) => {
    const { email } = req.query;
    if (!email || typeof email !== "string") {
      res.status(400).json({ success: false, error: "Email is required" });
      return;
    }
    const facultyUser = await db.query.users.findFirst({
      where: (cols, { eq }) => eq(cols.email, email),
      with: { faculty: true },
    });
    if (!facultyUser || !facultyUser.faculty) {
      res.status(404).json({ success: false, error: "Faculty not found" });
      return;
    }
    const { name, department, designation, room, phone } = facultyUser.faculty;
    res.status(200).json({
      success: true,
      faculty: {
        name,
        email,
        department,
        designation,
        room,
        phone,
      },
    });
  })
);

router.get(
    "/by-email-suggestions",
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
            res.status(400).json({
                success: false,
                error: "Email is required",
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

export default router;
