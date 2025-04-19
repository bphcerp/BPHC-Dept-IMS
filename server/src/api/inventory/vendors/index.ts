import { Router } from "express";
import getVendors from "./get.ts";
import createVendor from "./create.ts";
import updateVendor from "./update.ts";
import deleteVendor from "./delete.ts";

const router = Router();

router.use("/get", getVendors);
router.use("/create", createVendor);
router.use("/update", updateVendor);
router.use("/delete", deleteVendor);

export default router;
