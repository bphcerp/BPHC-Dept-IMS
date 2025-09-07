import { Router } from "express";
import formBuilder from "./formBuilder.ts";
import templateBuilder from "./templateBuilder.ts";

const router = Router();

router.use("/form/post", formBuilder);
router.use("/template/post", templateBuilder);

export default router;