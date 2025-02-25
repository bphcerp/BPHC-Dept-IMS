import express from "express";
import createRouter from "./create.ts";
import deleteRouter from "./delete.ts";
import editRouter from "./edit.ts";
import getRouter from "./[role].ts";
import renameRouter from "./rename.ts";

const router = express.Router();

router.use("/create", createRouter);
router.use("/delete", deleteRouter);
router.use("/edit", editRouter);
router.use("/rename", renameRouter);
router.use("/", getRouter);

export default router;
