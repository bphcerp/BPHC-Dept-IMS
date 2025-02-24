import express from "express";
import createApplication from "./createApplication.ts";

const router = express.Router();

router.use("/create", createApplication);

export default router;
