import express from "express";
import registerResponseRouter from "./register.ts";
import viewResponseByIdRouter from "./view.ts";
import getResponsesByFormIdRouter from "./getAll.ts";
import getResponsesByResponseIdRouter from "./get.ts";

const router = express.Router();

router.use("/register", registerResponseRouter);
router.use("/view", viewResponseByIdRouter);
router.use("/getAll", getResponsesByFormIdRouter);
router.use("/get", getResponsesByResponseIdRouter);

export default router;
