import express from "express";
import getPhDRecords from "./getPhd.ts";

const router = express.Router();

router.use("/getPhD", getPhDRecords);

export default router;
