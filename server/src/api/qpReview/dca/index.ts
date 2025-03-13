import express from "express";

import createReq from "./createReq.ts";

const router = express.Router();

router.use("/createReq", createReq);

export default router;
