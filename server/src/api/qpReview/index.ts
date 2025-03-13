import express from "express";
import dca from "./dca/index.ts";

const router = express.Router();

router.use("/dca", dca);

export default router;
