import express from "express";
import registerResponseRouter from "./register.ts";
import viewResponseByIdRouter from "./view.ts";
import getResponsesByFormIdRouter from "./get.ts";

const router = express.Router();

router.use("/register", registerResponseRouter);
router.use("/view", viewResponseByIdRouter);
router.use("/get", getResponsesByFormIdRouter);

export default router;
