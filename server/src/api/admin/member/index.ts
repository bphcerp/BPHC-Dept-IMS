import express from "express";
import inviteRouter from "./invite";
import editRolesRouter from "./edit-roles";

const router = express.Router();

router.use("/invite", inviteRouter);
router.use("/edit-roles", editRolesRouter);

export default router;
