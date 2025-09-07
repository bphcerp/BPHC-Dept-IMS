import express from "express";
import getProposals from "./getProposals.ts";
import submitProposal from "./submitProposal.ts";
import resubmitProposal from "./resubmitProposal.ts";

const router = express.Router();

router.use("/getProposals", getProposals);
router.use("/submitProposal", submitProposal);
router.use("/resubmit", resubmitProposal);

export default router;
