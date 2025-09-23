import express from "express";
import getProposals from "./getProposals.ts";
import submitProposal from "./submitProposal.ts";
import resubmitProposal from "./resubmitProposal.ts";
import viewProposal from "./viewProposal.ts";

const router = express.Router();

router.use("/getProposals", getProposals);
router.use("/submitProposal", submitProposal);
router.use("/resubmit", resubmitProposal);
router.use("/view", viewProposal);

export default router;
