import express from "express";
import inviteRouter from "./invite";
import editRolesRouter from "./edit";

const router = express.Router();

router.use("/invite", inviteRouter);
router.use("/edit", editRolesRouter);

export default router;
