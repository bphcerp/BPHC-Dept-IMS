import express from "express";
import roleRouter from "./role";
const router = express.Router();

router.use("/role", roleRouter);

export default router;
