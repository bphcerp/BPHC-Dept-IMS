import express from "express";
import roleRouter from "./role";
import memberRouter from "./member";
import permissionRouter from "./permission";
const router = express.Router();

router.use("/role", roleRouter);
router.use("/member", memberRouter);
router.use("/permission", permissionRouter);

export default router;
