import express from "express";

const router = express.Router();

import publicationsRouter from "./publications.ts";
import presentationRouter from "./presentation.ts"

router.use("/publications", publicationsRouter);
router.use("/presentation", presentationRouter);

export default router;
