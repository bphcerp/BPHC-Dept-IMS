import express from "express";
import registerResponseRouter from "./registerResponse.ts";


const router = express.Router();

router.use("/register", registerResponseRouter);



export default router;