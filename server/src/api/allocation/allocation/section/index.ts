import addRouter from "./add.ts";
import assignInstructor from "./assignInstructor.ts";
import dismissInstructor from "./dismissInstructor.ts";
import removeRouter from "./remove.ts";
import { Router } from "express";

const router = Router();

router.use("/add", addRouter);
router.use("/assignInstructor", assignInstructor);
router.use("/dismissInstructor", dismissInstructor);
router.use("/remove", removeRouter);

export default router;
