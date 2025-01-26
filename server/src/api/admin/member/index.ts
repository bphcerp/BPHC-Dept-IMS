import express from "express";
import addMemberRouter from "./addMember"

const router = express.Router();

router.use("/", addMemberRouter);

export default router;
