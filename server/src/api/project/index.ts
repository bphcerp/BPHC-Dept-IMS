import express from "express";
import create from "./create.ts";
import list from "./list.ts";
import details from "./[id].ts";
import bulkUpload from "./bulkUpload.ts";
import { authMiddleware } from "@/middleware/auth.ts";

const router = express.Router();

// Apply authentication middleware to all project routes
router.use(authMiddleware);

router.use("/create", create);
router.use("/list", list);
router.use("/bulk-upload", bulkUpload);
router.use("/", details); // handles /:id

export default router; 