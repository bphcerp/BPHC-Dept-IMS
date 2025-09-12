import express from "express";
import registerResponseRouter from "./registerResponse.ts";
import viewResponseByIdRouter from "./viewResponseById.ts";


const router = express.Router();

router.use("/register", registerResponseRouter);
router.use("/view/:id", viewResponseByIdRouter);



export default router;