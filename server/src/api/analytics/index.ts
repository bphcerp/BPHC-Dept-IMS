import express from "express";

const router = express.Router();

import publicationsRouter from "./publications.ts";

router.use("/publications", publicationsRouter);

export default router;
