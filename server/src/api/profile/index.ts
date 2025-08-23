import express from "express";
import signatureRouter from "./signature.ts";
import profileImageRouter from "./profile-image.ts";
import editRouter from "./edit.ts";
import myProfileRouter from "./myProfile.ts";

const router = express.Router();

router.use("/signature", signatureRouter);
router.use("/edit", editRouter);
router.use("/", myProfileRouter);
router.use("/profile-image", profileImageRouter);

export default router;
