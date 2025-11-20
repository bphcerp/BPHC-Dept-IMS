import { Router } from "express";
import {
    submitContribution,
    getAllContributions,
    approveContribution,
    rejectContribution,
} from "./contribution.controller";
import { validate } from "@/middleware/validate";
import {
    submitContributionSchema,
    approveContributionSchema,
    rejectContributionSchema,
} from "./contribution.validation";

const router = Router();

router.post("/submit", validate(submitContributionSchema), submitContribution);
router.get("/all", getAllContributions);
router.post("/approve", validate(approveContributionSchema), approveContribution);
router.post("/reject", validate(rejectContributionSchema), rejectContribution);

export default router;
