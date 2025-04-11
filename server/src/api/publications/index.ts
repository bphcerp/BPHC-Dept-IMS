import express from "express";

const router = express.Router();

import userRouter from "./user.ts";
import idRouter from "./id.ts";

router.use("/user", userRouter);
router.use("/id", idRouter);

export default router;
