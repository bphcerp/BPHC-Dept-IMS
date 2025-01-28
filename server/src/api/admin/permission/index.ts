import express from "express";
import getAllRouter from "./all";
const router = express.Router();

router.use("/all", getAllRouter);

export default router;
