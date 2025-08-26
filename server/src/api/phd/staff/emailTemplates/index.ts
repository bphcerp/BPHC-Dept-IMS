import express from "express";
import getEmailTemplates from "./getEmailTemplates.ts";
import updateEmailTemplate from "./updateEmailTemplate.ts";

const router = express.Router();

router.use("/", getEmailTemplates);
router.use("/", updateEmailTemplate);

export default router;