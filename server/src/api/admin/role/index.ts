import express from "express";
import createRouter from "./create";
const router = express.Router();

router.use("/create", createRouter);


import editRouter from "./editRole"


router.use("/editRoles", editRouter);
router.use("/editRoles", editRouter);

export default router;