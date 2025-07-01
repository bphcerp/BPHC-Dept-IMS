import express from "express";
import signatureRouter from "./signature.ts";
import profileImageRouter from "./profile-image.ts";

const router = express.Router();

router.use("/signature", signatureRouter);
router.use("/profile-image", profileImageRouter);

export default router;
