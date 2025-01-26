import express from "express";
import roleRouter from "./role";
import MemberRouter from "./member"
const router = express.Router();

router.use("/", roleRouter);
router.use("/", MemberRouter);

export default router;