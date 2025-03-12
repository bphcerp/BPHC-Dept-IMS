import express from "express";
import createApplication from "./createApplication.ts";
import getAllApplicationsDCA from "./getAllApplicationsDCA.ts";

const router = express.Router();

router.use("/create", createApplication);
router.use("/getAllApplicationsDCA", getAllApplicationsDCA);

export default router;
