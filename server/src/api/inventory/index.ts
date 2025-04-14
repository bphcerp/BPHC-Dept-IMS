import express from "express";
import labRouter from "./labs/index.ts";
import vendorRouter from "./vendors/index.ts";
import categoryRouter from "./categories/index.ts";
import inventoryRouter from "./items/index.ts";

const router = express.Router();

router.use('/labs', labRouter)
router.use('/vendors', vendorRouter)
router.use('/categories', categoryRouter)
router.use('/items', inventoryRouter)

export default router;
