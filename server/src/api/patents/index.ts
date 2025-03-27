import express from "express";
import addNewPatent from "./addNewPatents.ts";
import getAllPatents from "./getAllPatents.ts";
const router = express.Router();

router.use("/addNewPatent", addNewPatent);
router.use("/getAllPatents",getAllPatents);

export default router;
