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
  "/by-name",
  asyncHandler(async (req, res, _next) => {
    const { name } = req.query;
    if (!name || typeof name !== "string") {
      res.status(400).json({ success: false, error: "Name is required" });
      return;
    }
    const facultyUser = await db.query.users.findFirst({
      where: (cols, { eq }) => eq(cols.name, name),
      with: { faculty: true },
    });
    if (!facultyUser || !facultyUser.faculty) {
      res.status(404).json({ success: false, error: "Faculty not found" });
      return;
    }
    const { name: facultyName, department, designation, room, phone } = facultyUser.faculty;
    res.status(200).json({
      success: true,
      faculty: {
        name: facultyName,
        email: facultyUser.email,
        department,
        designation,
        room,
        phone,
      },
    });
  })
);

export default router;
