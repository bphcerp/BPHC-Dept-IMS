import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
    try {
        const labs = await db.query.laboratories.findMany({
            with: {
                technicianInCharge: true,
                facultyInCharge: true,
            }
        })
        res.status(200).json(labs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching laboratories', error });
        console.error(error);
    }
}))

export default router;