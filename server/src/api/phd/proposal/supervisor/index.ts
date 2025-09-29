import express from "express";
import getProposals from "./getProposals.ts";
import updateDacMembers from "./updateDacMembers.ts";
import viewProposal from "./viewProposal.ts";
import reviewProposal from "./reviewProposal.ts";
import setSeminarDetails from "./setSeminarDetails.ts";

const router = express.Router();

router.use("/getProposals", getProposals);
router.use("/viewProposal", viewProposal);
router.use("/updateDacMembers", updateDacMembers);
router.use("/reviewProposal", reviewProposal);
router.use("/setSeminarDetails", setSeminarDetails);

export default router;
