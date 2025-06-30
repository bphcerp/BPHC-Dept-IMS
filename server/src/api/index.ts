import express from "express";
import authRouter from "./auth/index.ts";
import adminRouter from "./admin/index.ts";
import phdRouter from "./phd/index.ts";
import handoutRouter from "./handout/index.ts";
import conferenceRouter from "./conference/index.ts";
import qpRouter from "./qp/index.ts";
import fileRouter from "./file/index.ts";
import publicationsRouter from "./publications/index.ts";
import inventoryRouter from "./inventory/index.ts";
import profileRouter from "./profile/index.ts";
import projectRouter from "./project/index.ts";

import todosRoute from "./todos.ts";
import clearNotificationsRoute from "./clearNotifications.ts";
import readNotificationsRoute from "./readNotifications.ts";

const router = express.Router();

// Public routes
router.get("/hello", (_req, res) => {
    res.status(200).json({
        message: "Hello!",
    });
});

router.use("/f", fileRouter);

// Auth routes and middleware
router.use(authRouter);

router.use("/admin", adminRouter);
router.use("/phd", phdRouter);
router.use("/handout", handoutRouter);
router.use("/conference", conferenceRouter);
router.use("/qp", qpRouter);
router.use("/publications", publicationsRouter);
router.use("/inventory", inventoryRouter);

router.use("/todos", todosRoute);
router.use("/clearNotifications", clearNotificationsRoute);
router.use("/readNotifications", readNotificationsRoute);
router.use("/profile", profileRouter);
router.use("/project", projectRouter);

export default router;
