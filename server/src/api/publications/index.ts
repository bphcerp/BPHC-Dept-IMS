import express from "express";

const router = express.Router();

import userRouter from "./user.ts";

router.use("/user", userRouter);

export default router;
