import express from "express";
import getProposals from "./getProposals.ts";
import viewProposal from "./viewProposal.ts";
import approve from "./approve.ts";

const router = express.Router();

router.use("/getProposals", getProposals);
router.use("/viewProposal", viewProposal);
router.use("/approve", approve);

export default router;
