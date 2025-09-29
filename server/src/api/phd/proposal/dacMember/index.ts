// server/src/api/phd/proposal/dacMember/index.ts
import express from "express";
import getProposals from "./getProposals.ts";
import viewProposal from "./viewProposal.ts";
import submitReview from "./submitReview.ts";

const router = express.Router();

router.use("/getProposals", getProposals);
router.use("/viewProposal", viewProposal);
router.use("/submitReview", submitReview);

export default router;