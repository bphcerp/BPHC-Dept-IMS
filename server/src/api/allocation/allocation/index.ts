import { Router } from "express";
import updateAllocation from "./update.ts";
import deleteAllocation from "./delete.ts";

const router = Router();

router.use("/update", updateAllocation);
router.use("/delete", deleteAllocation);

export default router;