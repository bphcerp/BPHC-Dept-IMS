import express from "express";
import addNewPatent from "./addNewPatents.ts";
import getAllPatents from "./getAllPatents.ts";
import getPatentsbyInventorName from "./getPatentsbyInventorName.ts";
const router = express.Router();

router.use("/addNewPatent", addNewPatent);
router.use("/getAllPatents",getAllPatents);
router.use("/getPatentsbyInventorName",getPatentsbyInventorName);

export default router;
