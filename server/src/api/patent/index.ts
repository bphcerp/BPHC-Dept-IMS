import express from "express";
import create from "./create.ts";
import list from "./list.ts";
import listAll from "./list-all.ts";
import details from "./[id].ts";
import bulkUpload from "./bulkUpload.ts";

const router = express.Router();

router.use("/create", create);
router.use("/list", list);
router.use("/list-all", listAll);
router.use("/bulkUpload", bulkUpload);
router.use("/", details);

export default router; 