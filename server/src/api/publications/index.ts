import express from "express";

const router = express.Router();

import userRouter from "./user.ts";
import idRouter from "./id.ts";
import allRouter from "./all.ts";

router.use("/user", userRouter);
router.use("/id", idRouter);
router.use("/all", allRouter);

export default router;
