import express from "express";
import sendToDac from "./sendToDac.ts";
import getProposals from "./getProposals.ts";
import viewProposal from "./viewProposal.ts";

const router = express.Router();

router.use("/sendToDac", sendToDac);
router.use("/getProposals", getProposals);
router.use("/viewProposal", viewProposal);

export default router;