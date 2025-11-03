import express from "express";
import getProposals from "./getProposals.ts";
import viewProposal from "./viewProposal.ts";
import reviewProposal from "./reviewProposal.ts";
import downloadProposalPackage from "./downloadProposalPackage.ts";
import finalizeProposals from './finalizeProposals.ts';
import downloadProposalNotice from './downloadProposalNotice.ts';
import requestSeminarDetails from './requestSeminarDetails.ts';
import remindSeminarDetails from './remindSeminarDetails.ts';
import seminarSlots from './seminarSlots.ts';
import sendBulkReminder from './sendBulkReminder.ts';
import getBulkDetails from "./getBulkDetails.ts";
import reenableProposal from "./reenableProposal.ts";
import cancelSeminarBookingRouter from "./cancelSeminarBooking.ts";

const router = express.Router();

router.use("/getProposals", getProposals);
router.use("/viewProposal", viewProposal);
router.use("/reviewProposal", reviewProposal);
router.use("/requestSeminarDetails", requestSeminarDetails);
router.use("/remindSeminarDetails", remindSeminarDetails);
router.use("/downloadProposalPackage", downloadProposalPackage);
router.use('/finalizeProposals', finalizeProposals);
router.use('/downloadProposalNotice', downloadProposalNotice);
router.use('/seminarSlots', seminarSlots);
router.use('/sendBulkReminder', sendBulkReminder);
router.use("/getBulkDetails", getBulkDetails);
router.use("/reenableProposal", reenableProposal);
router.use("/cancelSeminarBooking", cancelSeminarBookingRouter);

export default router;