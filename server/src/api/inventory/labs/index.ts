import { Router } from "express";
import getLabs from "./get.ts";
import createLab from "./create.ts";
import updateLab from "./update.ts";
import deleteLab from "./delete.ts";

const router = Router()

router.use('/get', getLabs)
router.use('/create', createLab);
router.use('/update', updateLab);
router.use('/delete', deleteLab);

export default router