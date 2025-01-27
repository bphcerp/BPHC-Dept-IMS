import express from "express";
import createRouter from "./create";
import getAllRouter from "./all";
const router = express.Router();

router.use("/create", createRouter);
router.use("/all", getAllRouter);

export default router;
