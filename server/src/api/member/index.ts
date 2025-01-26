import express from "express";
import addMemberRouter from "./addMember"
//import {  checkAccess } from "@/middleware/auth";

const router = express.Router();


router.use("/", addMemberRouter);


export default router;
