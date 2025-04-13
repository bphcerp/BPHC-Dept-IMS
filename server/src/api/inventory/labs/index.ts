import { Router } from "express";
import getLabs from "./getLabs.ts";
import createLab from "./createLab.ts";
import updateLab from "./updateLab.ts";
import deleteLab from "./deleteLab.ts";

const router = Router()

router.use('/getLabs', getLabs)
router.use('/createLab', createLab);
router.use('/updateLab', updateLab);
router.use('/deleteLab', deleteLab);

export default router