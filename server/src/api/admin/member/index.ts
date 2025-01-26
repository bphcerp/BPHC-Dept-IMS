import express from "express";
import addMemberRouter from "./addMember"

const router = express.Router();

router.use("/add-member", addMemberRouter);

export default router;
