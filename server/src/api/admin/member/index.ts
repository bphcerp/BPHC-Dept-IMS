import express from "express";

import inviteRouter from "./invite.ts";
import editRolesRouter from "./editroles.ts";
import editDetailsRouter from "./editdetails.ts";
import searchRouter from "./search.ts";
import deactivateRouter from "./deactivate.ts";
import deleteRouter from "./delete.ts";
import detailsRouter from "./details.ts";
import profileImageRouter from "./profile-image.ts";
import getAllFacultyRouter  from "./getAllFaculty.ts";
import getAllStaffRouter  from "./getAllStaff.ts";
import getAllPhDRouter from "./getAllPhD.ts";

const router = express.Router();

router.use("/invite", inviteRouter);
router.use("/editroles", editRolesRouter);
router.use("/editdetails", editDetailsRouter);
router.use("/search", searchRouter);
router.use("/deactivate", deactivateRouter);
router.use("/delete", deleteRouter);
router.use("/details", detailsRouter);
router.use("/profile-image", profileImageRouter);

router.use("/getAllFaculty", getAllFacultyRouter);
router.use("/getAllStaff", getAllStaffRouter);
router.use("/getAllPhD", getAllPhDRouter);

export default router;
