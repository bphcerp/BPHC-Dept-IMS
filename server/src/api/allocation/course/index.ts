import { Router } from "express";
import updateCategory from "./update.ts";
import deleteCategory from "./delete.ts";

const router = Router();

router.use("/update", updateCategory);
router.use("/delete", deleteCategory);

export default router;