import express from "express";
import roleRouter from "./role";
import MemberRouter from "./member"
const router = express.Router();

router.use("/role", roleRouter);
router.use("/member", MemberRouter);

export default router;