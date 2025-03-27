import express from "express";

import inviteRouter from "./invite.ts";
import editRolesRouter from "./editroles.ts";
import editDetailsRouter from "./editdetails.ts";
import searchRouter from "./search.ts";
import deactivateRouter from "./deactivate.ts";
import deleteRouter from "./delete.ts";
import detailsRouter from "./details.ts";

const router = express.Router();

router.use("/invite", inviteRouter);
router.use("/editroles", editRolesRouter);
router.use("/editdetails", editDetailsRouter);
router.use("/search", searchRouter);
router.use("/deactivate", deactivateRouter);
router.use("/delete", deleteRouter);
router.use("/details", detailsRouter);

export default router;
