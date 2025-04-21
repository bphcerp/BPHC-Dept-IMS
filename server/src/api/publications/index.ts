import express from "express";

const router = express.Router();

import userRouter from "./user.ts";
import idRouter from "./id.ts";
import allRouter from "./all.ts";
import updateStatusRouter from "./updateStatus.ts";
import updatePublicationsRouter from "./updatePublications.ts";

router.use("/user", userRouter);
router.use("/id", idRouter);
router.use("/all", allRouter);
router.use("/updateStatus", updateStatusRouter);
router.use("/updatePublications", updatePublicationsRouter);

export default router;
