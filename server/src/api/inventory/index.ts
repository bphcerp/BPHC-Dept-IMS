import express from "express";
import labRouter from "./labs/index.ts";
import vendorRouter from "./vendors/index.ts";

const router = express.Router();

router.use('/labs', labRouter)
router.use('/vendors', vendorRouter)

export default router;
