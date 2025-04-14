import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
    try {
        const vendors = await db.query.vendors.findMany();
        res.status(200).json(vendors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vendors', error });
        console.error(error);
    }
}));

export default router;
