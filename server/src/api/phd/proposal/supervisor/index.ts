import express from "express";
import getProposals from "./getProposals.ts";
import updateCoSupervisors from "./updateCoSupervisors.ts";
import updateDacMembers from "./updateDacMembers.ts";
import viewProposal from "./viewProposal.ts";
import approveAndSign from "./approveAndSign.ts";

const router = express.Router();

router.use("/getProposals", getProposals);
router.use("/viewProposal", viewProposal);
router.use("/updateCoSupervisors", updateCoSupervisors);
router.use("/updateDacMembers", updateDacMembers);
router.use("/approveAndSign", approveAndSign);

export default router;
