import { Router } from "express";
import getCategories from "./get.ts";
import createCategory from "./create.ts";
import updateCategory from "./update.ts";
import deleteCategory from "./delete.ts";

const router = Router();

router.use("/get", getCategories);
router.use("/create", createCategory);
router.use("/update", updateCategory);
router.use("/delete", deleteCategory);

export default router;
