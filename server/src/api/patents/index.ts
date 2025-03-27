import express from "express";
import addNewPatent from "./addNewPatents.ts";

const router = express.Router();

router.use("/addNewPatent", addNewPatent);

export default router;
