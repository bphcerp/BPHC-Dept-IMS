import express from "express";

import inviteRouter from "./invite.ts";
import editRolesRouter from "./editroles.ts";
import searchRouter from "./search.ts";
import deactivateRouter from "./deactivate.ts";
import detailsRouter from "./details.ts";

const router = express.Router();

router.use("/invite", inviteRouter);
router.use("/editroles", editRolesRouter);
router.use("/search", searchRouter);
router.use("/deactivate", deactivateRouter);
router.use("/details", detailsRouter);
export default router;
