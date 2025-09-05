import express from "express";
import getApplicationsForSuggestion from "./getApplicationsForSuggestion.ts";
import suggestExaminers from "./suggestExaminers.ts";
import getFacultyList from "./getFacultyList.ts";

const router = express.Router();

router.use("/getApplicationsForSuggestion", getApplicationsForSuggestion);
router.use("/suggestExaminers", suggestExaminers);
router.use("/getFacultyList", getFacultyList);

export default router;
