import express from "express";

const router = express.Router();

import publicationsRouter from "./publications.ts";
import presentationRouter from "./presentation.ts"
import templatesRouter from "./presentationTemplates.ts"

router.use("/publications", publicationsRouter);
router.use("/presentation", presentationRouter);
router.use("/templates", templatesRouter);

export default router;
