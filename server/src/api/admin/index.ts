import express from "express";
import roleRouter from "./role/index.ts";
import memberRouter from "./member/index.ts";
import permissionRouter from "./permission/index.ts";

const router = express.Router();

router.use("/role", roleRouter);
router.use("/member", memberRouter);
router.use("/permission", permissionRouter);

export default router;
