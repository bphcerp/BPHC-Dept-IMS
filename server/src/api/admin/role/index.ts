import express from "express";
import editRouter from "./editRole"

const router = express.Router();

router.use("/", editRouter);

export default router;