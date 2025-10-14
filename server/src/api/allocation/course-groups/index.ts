import createRouter from "./create.ts";
import getRouter from "./get.ts";
import addRouter from "./add.ts";
import express from "express";

const router = express.Router();

router.use("/create", createRouter);
router.use("/get", getRouter);
router.use("/add", addRouter);

export default router;
