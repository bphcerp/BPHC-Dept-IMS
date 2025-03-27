import { patents } from "@/config/db/schema/patents.ts"; // Import your tables
import express from "express";
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { patentsSchemas } from "lib";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.post(
    "/",
    checkAccess("patents:create_patent"),
    asyncHandler(async (req, res, next) => {
        const parsed = patentsSchemas.addNewPatentBodySchema.parse(req.body);
        const notFound: string[] = [];

        // Retrieve user IDs and emails for the given inventor names
        const inventorsData = await Promise.all(
            parsed.inventors.map(async (inventorName) => {
                const userData = await db.query.faculty.findFirst({
                    columns: {
                        email: true,
                        name: true,
                    },
                    where: ({ name }, { like }) => like(name, inventorName),
                });
                if (!userData) {
                    notFound.push(inventorName);
                }
                return userData;
            })
        );

        const foundInventors = inventorsData.filter(
            (data) => data !== undefined
        );

        if (!foundInventors.length) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "No inventors found")
            );
        }

        // Insert the new patent into the 'patents' table
        const inserted = await db
            .insert(patents)
            .values(
                foundInventors.map((e) => ({
                    userEmail: e.email,
                    inventorsName: e.name ?? "Inventor",
                    filingId: parsed.filing_id,
                    applicationNumber: parsed.application_number,
                }))
            )
            .returning();

        // Return the inserted patent data along with inventors' emails
        res.status(201).json({ inserted, inventors: foundInventors, notFound });
    })
);

export default router;
