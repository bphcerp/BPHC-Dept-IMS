import inputDetails from "./inputDetails.ts"
import express from "express";


const router = express.Router();

router.use("/inputDetails", inputDetails);

export default router;
