import { Router } from "express";
import formBuilder from "./form/create.ts";
import getForm from "./form/get.ts";
import getFormInfo from "./form/getInfo.ts";
import templateBuilder from "./template/create.ts";
import getTemplate from "./template/get.ts";
import getAllTemplates from "./template/getAll.ts";
import getInfo from "./form/getInfo.ts";
import getAllForms from "./form/getAll.ts";
import registerResponseRouter from "./form/response/index.ts";

const router = Router();

router.use("/form/create", formBuilder);
router.use("/form/get", getForm);
router.use("/form/getInfo", getFormInfo);
router.use("/form/getAll", getAllForms);
router.use("/form/response", registerResponseRouter);


router.use("/template/get", getTemplate);
router.use("/template/getAll", getAllTemplates);
router.use("/template/getInfo", getInfo);
router.use("/template/create", templateBuilder);


export default router;