import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";


const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        res.send("Hello from dca side!");
    })
);

export default router;
