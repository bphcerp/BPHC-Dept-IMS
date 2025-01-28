import express from "express";
import createRouter from "./create.ts";
import getAllRouter from "./all.ts";
import deleteRouter from "./delete.ts";
const router = express.Router();

router.use("/create", createRouter);
router.use("/all", getAllRouter);
router.use("/delete", deleteRouter);

export default router;
