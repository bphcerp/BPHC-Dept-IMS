import express from "express";
import editRouter from "./editRole"
import createRouter from "./create";
const router = express.Router();

router.use("/editRoles", editRouter);

router.use("/create", createRouter);

export default router;
