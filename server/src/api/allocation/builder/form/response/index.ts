import express from "express";
import registerResponseRouter from "./registerResponse.ts";
import viewResponseByIdRouter from "./viewResponseById.ts";
import getResponsesByFormIdRouter from "./getResponsesByFormId.ts";


const router = express.Router();

router.use("/register", registerResponseRouter);
router.use("/view/:id", viewResponseByIdRouter);
router.use("/get/:id", getResponsesByFormIdRouter);



export default router;