import express from "express";
import signatureRouter from "./signature.ts";
import profileImageRouter from "./profile-image.ts";
import editRouter from "./edit.ts";

const router = express.Router();

router.use("/signature", signatureRouter);
router.use("/edit", editRouter);
router.use("/profile-image", profileImageRouter);

export default router;
