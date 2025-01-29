import express from "express";
import inviteRouter from "./invite";
import editRolesRouter from "./edit";
import searchRouter from "./search";
import deactivateRouter from "./deactivate";
import detailsRouter from "./details";
const router = express.Router();

router.use("/invite", inviteRouter);
router.use("/edit", editRolesRouter);
router.use("/search", searchRouter);
router.use("/deactivate", deactivateRouter);
router.use("/details", detailsRouter);
export default router;
