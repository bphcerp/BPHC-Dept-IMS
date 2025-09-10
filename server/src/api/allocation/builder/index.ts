import { Router } from "express";
import formBuilder from "./form/create.ts";
import getForm from "./form/get.ts";
import getFormInfo from "./form/getInfo.ts";
import templateBuilder from "./template/create.ts";
import getTemplate from "./template/get.ts";
import getAllForms from "./form/getAll.ts";
const router = Router();

router.use("/form/create", formBuilder);
router.use("/form/get", getForm);
router.use("/form/getInfo", getFormInfo);
router.use("/form/getAll", getAllForms);

router.use("/template/get", getTemplate);
router.use("/template/create", templateBuilder);


export default router;