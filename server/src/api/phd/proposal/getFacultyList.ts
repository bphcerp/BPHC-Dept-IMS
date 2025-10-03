import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { z } from "zod";
import { getUsersWithPermission } from "@/lib/common/index.ts";

const router = express.Router();

const querySchema = z.object({
    role: z.enum(["drc", "dac"]).optional(),
});

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { role } = querySchema.parse(req.query);

        if (role === "drc") {
            // If the role is 'drc', filter for users with the specific DRC member view permission.
            const drcUsers = await getUsersWithPermission(
                "phd-request:drc-member:view"
            );
            const drcEmails = new Set(drcUsers.map((user) => user.email));

            const facultyList = await db.query.faculty.findMany({
                where: (faculty, { inArray }) =>
                    inArray(faculty.email, [...drcEmails]),
                columns: {
                    email: true,
                    name: true,
                    department: true,
                },
            });
            res.status(200).json(facultyList);
        } else if (role === "dac") {
            // If the role is 'dac', filter for users with the specific DAC proposal permission.
            const dacUsers = await getUsersWithPermission("phd:dac:proposal");
            const dacEmails = new Set(dacUsers.map((user) => user.email));

            const facultyList = await db.query.faculty.findMany({
                where: (faculty, { inArray }) =>
                    inArray(faculty.email, [...dacEmails]),
                columns: {
                    email: true,
                    name: true,
                    department: true,
                },
            });
            res.status(200).json(facultyList);
        } else {
            // Default behavior: if no role is specified, return all faculty members.
            const allFacultyList = await db.query.faculty.findMany({
                columns: {
                    email: true,
                    name: true,
                    department: true,
                },
            });
            res.status(200).json(allFacultyList);
        }
    })
);
