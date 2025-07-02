import express from "express";
import create from "./create.ts";
import list from "./list.ts";
import details from "./[id].ts";
import bulkUpload from "./bulkUpload.ts";
import faculty from "./faculty.ts";
import listAll from "./list-all.ts";

const router = express.Router();

router.use("/create", create);
router.use("/list", list);
router.use("/bulk-upload", bulkUpload);
router.use("/faculty", faculty);
router.use("/list-all", listAll);
router.use("/", details);

export default router; 