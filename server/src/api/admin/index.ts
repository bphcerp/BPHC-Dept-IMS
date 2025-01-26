import express from "express";
import roleRouter from "./role";
import memberRouter from "./member";
const router = express.Router();

router.use("/role", roleRouter);
router.use("/member", memberRouter);

export default router;
