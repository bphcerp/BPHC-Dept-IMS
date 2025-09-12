import { Router } from "express";
import updateCategory from "./update.ts";
import deleteCategory from "./delete.ts";
import viewResponseRouter from "./viewResponse.ts";

const router = Router();

router.use("/update", updateCategory);
router.use("/delete", deleteCategory);
router.use("/viewResponse", viewResponseRouter);

export default router;