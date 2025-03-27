import express from "express";
import authRouter from "./auth/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import adminRouter from "./admin/index.ts";
import phdRouter from "./phd/index.ts";
import handoutRouter from "./handout/index.ts";
import conferenceRouter from "./conference/index.ts";
import qpRouter from "./qp/index.ts";
import fileRouter from "./file/index.ts";
import patentsRouter from "./patents/index.ts";

const router = express.Router();

// Public routes
router.get("/hello", (_req, res) => {
    res.status(200).json({
        message: "Hello!",
    });
});
router.use("/f", fileRouter);

// Auth routes and middleware
router.use(authRouter);

// protected example, only roles with access to resourcekey can access
router.get("/protected", checkAccess("resourcekey"), (_req, res) => {
    res.status(200).json({
        message: "Protected!",
    });
});

router.use("/admin", adminRouter);
router.use("/phd", phdRouter);
router.use("/handout", handoutRouter);
router.use("/conference", conferenceRouter);
router.use("/qp", qpRouter);
router.use("/patents", patentsRouter);

export default router;
