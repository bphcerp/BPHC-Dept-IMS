import express from "express";
import inviteRouter from "./invite.ts";
import editRolesRouter from "./edit.ts";

const router = express.Router();

router.use("/invite", inviteRouter);
router.use("/edit", editRolesRouter);

export default router;
