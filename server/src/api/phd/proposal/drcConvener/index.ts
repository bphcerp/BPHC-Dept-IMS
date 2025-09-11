import express from "express";
import sendToDac from "./sendToDac.ts";
import getProposals from "./getProposals.ts";
import viewProposal from "./viewProposal.ts";
import reviewProposal from "./reviewProposal.ts";
import setSeminarDetails from "./setSeminarDetails.ts";
import downloadProposalPackage from "./downloadProposalPackage.ts";
import finalizeProposals from './finalizeProposals.ts';

const router = express.Router();

router.use("/sendToDac", sendToDac);
router.use("/getProposals", getProposals);
router.use("/viewProposal", viewProposal);
router.use("/reviewProposal", reviewProposal);
router.use("/setSeminarDetails", setSeminarDetails);
router.use("/downloadProposalPackage", downloadProposalPackage);
router.use('/finalizeProposals', finalizeProposals);

export default router;