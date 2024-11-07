import express from "express";
import authRouter from "./auth";
import { checkAccess } from "@/middleware/auth";

const router = express.Router();

// Public routes
router.get("/hello", (_req, res) => {
    res.status(200).json({
        message: "Hello!",
    });
});

// Auth routes and middleware
router.use(authRouter);

// protected example, only roles with access to resourcekey can access
router.get("/protected", checkAccess("resourcekey"), (_req, res) => {
    res.status(200).json({
        message: "Protected!",
    });
});

export default router;
