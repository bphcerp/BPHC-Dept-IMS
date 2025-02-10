import express from "express";
import getPhdRecords from "./getPhd.ts";

const router = express.Router();

router.use("/getPhd", getPhdRecords);

export default router;
