import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { adminSchemas } from "lib";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { q: searchQuery } = adminSchemas.memberSearchQuerySchema.parse(
            req.query
        );
        const roles = (await db.query.roles.findMany()).reduce(
            (acc, role) => {
                acc[role.id] = role.roleName;
                return acc;
            },
            {} as Record<number, string>
        );
        const faculty = (
            await db.query.faculty.findMany({
                columns: {
                    email: true,
                    name: true,
                },
                where: (fields, { or, ilike }) =>
                    searchQuery?.length
                        ? or(
                              ilike(fields.email, `%${searchQuery}%`),
                              ilike(fields.name, `%${searchQuery}%`)
                          )
                        : undefined,
                with: {
                    user: {
                        columns: {
                            deactivated: true,
                            roles: true,
                        },
                    },
                },
            })
        ).map(({ user, ...f }) => ({
            ...f,
            type: "faculty",
            roles: user.roles,
            deactivated: user.deactivated,
        }));
        const phd = (
            await db.query.phd.findMany({
                columns: {
                    email: true,
                    name: true,
                    phdType: true,
                },
                where: (fields, { or, ilike }) =>
                    searchQuery?.length
                        ? or(
                              ilike(fields.email, `%${searchQuery}%`),
                              ilike(fields.name, `%${searchQuery}%`)
                          )
                        : undefined,
                with: {
                    user: {
                        columns: {
                            deactivated: true,
                            roles: true,
                        },
                    },
                },
            })
        ).map(({ user, ...p }) => ({
            ...p,
            type: "phd",
            roles: user.roles,
            deactivated: user.deactivated,
        }));
        const staff = (
            await db.query.staff.findMany({
                columns: {
                    email: true,
                    name: true,
                },
                where: (fields, { or, ilike }) =>
                    searchQuery?.length
                        ? or(
                              ilike(fields.email, `%${searchQuery}%`),
                              ilike(fields.name, `%${searchQuery}%`)
                          )
                        : undefined,
                with: {
                    user: {
                        columns: {
                            deactivated: true,
                            roles: true,
                        },
                    },
                },
            })
        ).map(({ user, ...s }) => ({
            ...s,
            type: "staff",
            roles: user.roles,
            deactivated: user.deactivated,
        }));
        const results = [...faculty, ...phd, ...staff].map((r) => ({
            ...r,
            roles: r.roles.map((role) => roles[role]),
        }));
        res.status(200).json(results);
    })
);

export default router;
