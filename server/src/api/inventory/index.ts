import express from "express";
import labRouter from "./labs/index.ts";
import vendorRouter from "./vendors/index.ts";
import categoryRouter from "./categories/index.ts";
import inventoryRouter from "./items/index.ts";
import statsRouter from "./stats/index.ts";

const router = express.Router();

router.use("/labs", labRouter);
router.use("/vendors", vendorRouter);
router.use("/categories", categoryRouter);
router.use("/items", inventoryRouter);
router.use("/stats", statsRouter);

export default router;
