import { db } from "@/config/db/index.ts"; 
import { excelPatents } from "@/config/db/schema/patents.ts"; 
import express from "express";
import { updatePatentInventorEmailSchema } from "@/validations/patentSchemas.ts"; 
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.patch(
    "/updatePatentInventorEmail",
    asyncHandler(async (req, res, next) => {
        // Validate request body with Zod
        const validation = updatePatentInventorEmailSchema.safeParse(req.body);
        if (!validation.success) {
            return next(new HttpError(HttpCode.BAD_REQUEST, validation.error.errors[0].message));
        }

        const { application_number, inventorIndex, newEmail } = validation.data;

        try {
            // Fetch the patent row
            const patentRow = await db.query.excelPatents.findFirst({
                where: (patents, { eq }) => eq(patents.application_number, application_number),
            });

            if (!patentRow) {
                return next(new HttpError(HttpCode.NOT_FOUND, "Patent row not found"));
            }

            //Parse inventors_with_email (fallback to inventors_name if necessary)
            let inventorsStr = patentRow.inventors_with_email || patentRow.inventors_name || "";

            // Helper function to parse "Name (email), Another Name (email)" -> array of { name, email }
            const parseInventorsString = (str: string) => {
                if (!str.trim()) return [];
                return str.split(",").map((entry) => {
                    const match = entry.trim().match(/(.*)\((.*)\)/);
                    return match ? { name: match[1].trim(), email: match[2].trim() } : { name: entry.trim(), email: "" };
                });
            };

            // Convert string to array
            let inventorsArray = parseInventorsString(inventorsStr);

            // Update the specific inventor's email
            if (!inventorsArray[inventorIndex]) {
                return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid inventor index"));
            }

            inventorsArray[inventorIndex].email = newEmail;

            //Convert the updated array back to a string
            const updatedInventorsStr = inventorsArray
                .map((inv) => `${inv.name} (${inv.email || "No Email"})`)
                .join(", ");

            //Save the updated string in the database
            await db.update(excelPatents)
                .set({ inventors_with_email: updatedInventorsStr })
                .where((patents, { eq }) => eq(patents.application_number, application_number));

            return res.status(200).json({ success: true, updated_inventors_with_email: updatedInventorsStr });
        } catch (err) {
            console.error("Server Error in /updatePatentInventorEmail:", err);
            return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Internal server error"));
        }
    })
);

export default router;
