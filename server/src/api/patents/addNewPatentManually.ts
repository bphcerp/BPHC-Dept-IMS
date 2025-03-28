import { db } from "@/config/db/index.ts"; // Import Drizzle instance
import { excelpatents, users } from "@/config/db/schema/patents.ts"; // Import schema
import express from "express";
import { addPatentFormSchema } from "@/validations/patentSchemas.ts"; // Import Zod schema
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.post(
    "/addPatentForm",
    asyncHandler(async (req, res, next) => {
        // Validate request body with Zod
        const validation = addPatentFormSchema.safeParse(req.body);
        if (!validation.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, validation.error.errors[0].message));
        }

        const {
            application_number,
            inventors_name,
            department,
            title,
            campus,
            filing_date,
            application_publication_date,
            granted_date,
            filing_fy,
            filing_ay,
            published_ay,
            published_fy,
            granted_fy,
            granted_ay,
            granted_cy,
            status
        } = validation.data;

        try {
            // Parse inventor names into a Set
            let inventorNames = new Set(inventors_name.split(",").map(name => name.trim()));

            // Fetch user emails for these inventors
            const usersData = await db.query.users.findMany({
                where: (user, { inArray }) => inArray(user.name, Array.from(inventorNames)),
                columns: { name: true, email: true }
            });

            if (!usersData) {
                return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to fetch user emails"));
            }

            // Extract emails from the user data
            const emails = usersData.map(user => user.email);

            // Insert new patent into the 'excelpatents' table
            await db.insert(excelpatents).values({
                application_number,
                inventors_name,
                department,
                title,
                campus,
                filing_date,
                application_publication_date,
                granted_date,
                filing_fy,
                filing_ay,
                published_ay,
                published_fy,
                granted_fy,
                granted_ay,
                granted_cy,
                status
            });

            return res.status(200).json({ message: "Patent inserted successfully via form" });
        } catch (error) {
            console.error("Error in /addPatentForm route:", error);
            return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    })
);

export default router;
