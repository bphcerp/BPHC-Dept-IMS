import { Router } from "express";
import formCreateRouter from "./form/create.ts";
import getFormRouter from "./form/get.ts";
import getAllFormsRouter from "./form/getAll.ts";
import registerResponseRouter from "./form/response/index.ts";
import formDeleteRouter from "./form/delete.ts";

import templateCreateRouter from "./template/create.ts";
import templateDeleteRouter from "./template/delete.ts";
import getTemplateRouter from "./template/get.ts";
import getAllTemplatesRouter from "./template/getAll.ts";

const router = Router();

router.use("/form/create", formCreateRouter);
router.use("/form/get", getFormRouter);
router.use("/form/getAll", getAllFormsRouter);
router.use("/form/response", registerResponseRouter);
router.use("/form/delete", formDeleteRouter);

router.use("/template/get", getTemplateRouter);
router.use("/template/getAll", getAllTemplatesRouter);
router.use("/template/create", templateCreateRouter);
router.use("/template/delete", templateDeleteRouter);

export default router;
