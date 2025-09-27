import express from "express";
import erpLookup from "./lookupByErp.ts";

const router = express.Router();

router.use("/lookupByErp", erpLookup);

export default router;



