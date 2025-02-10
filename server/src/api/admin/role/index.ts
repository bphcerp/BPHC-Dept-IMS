import express from "express";
import createRouter from "./create.ts";
import getAllRouter from "./all.ts";
import deleteRouter from "./delete.ts";
import editRouter from "./edit.ts";
import getPermissionsRouter from "./get.ts";
import renameRouter from "./rename.ts";

const router = express.Router();

router.use("/create", createRouter);
router.use("/all", getAllRouter);
router.use("/delete", deleteRouter);
router.use("/edit", editRouter);
router.use("/rename", renameRouter);
router.use("/", getPermissionsRouter);

export default router;
