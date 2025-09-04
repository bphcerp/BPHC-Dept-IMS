import express from "express";
import getProposals from "./getProposals.ts";
import submitProposal from "./submitProposal.ts";

const router = express.Router();

router.use("/getProposals", getProposals);
router.use("/submitProposal", submitProposal);

export default router;
