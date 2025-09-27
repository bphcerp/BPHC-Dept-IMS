import express from "express";
import listRoute from "./list.ts";
import saveRoute from "./save.ts";
import uploadDocRoute from "./uploadDoc.ts";

const router = express.Router();

router.use("/", listRoute);
router.use("/save", saveRoute);
router.use("/uploadDoc", uploadDocRoute);

export default router;



