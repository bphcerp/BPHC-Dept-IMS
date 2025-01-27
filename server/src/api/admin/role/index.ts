import express from "express";
import createRouter from "./create";
import deleteRouter from "./delete";
const router = express.Router();

router.use("/create", createRouter);
router.use("/delete", deleteRouter);

export default router;
