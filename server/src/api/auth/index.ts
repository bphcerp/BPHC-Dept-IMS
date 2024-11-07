import express from "express";
import loginRouter from "./login";
import refreshRouter from "./refresh";
import logoutRouter from "./logout";
import { authMiddleware } from "@/middleware/auth";

const router = express.Router();

router.use("/auth/login", loginRouter);
router.use("/auth/refresh", refreshRouter);
router.use(authMiddleware);
router.use("/auth/logout", logoutRouter);

export default router;
