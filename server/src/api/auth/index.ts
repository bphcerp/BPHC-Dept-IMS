import express from "express";
import loginRouter from "./login.ts";
import refreshRouter from "./refresh.ts";
import logoutRouter from "./logout.ts";
import { authMiddleware } from "@/middleware/auth.ts";

const router = express.Router();

router.use("/auth/login", loginRouter);
router.use("/auth/refresh", refreshRouter);
router.use(authMiddleware);
router.use("/auth/logout", logoutRouter);

export default router;
