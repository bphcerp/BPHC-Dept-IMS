import express from "express";
import authRouter from "./auth/index.ts";
import adminRouter from "./admin/index.ts";
import phdRouter from "./phd/index.ts";
import handoutRouter from "./handout/index.ts";
import conferenceRouter from "./conference/index.ts";
import analyticsRouter from "./analytics/index.ts";
import qpRouter from "./qp/index.ts";
import fileRouter from "./file/index.ts";
import publicationsRouter from "./publications/index.ts";
import inventoryRouter from "./inventory/index.ts";
import profileRouter from "./profile/index.ts";
import projectRouter from "./project/index.ts";
import patentRouter from "./patent/index.ts";
import wilpProjectRouter from "./wilpProject/index.ts";
import contributorsRouter from "./contributors.ts";
import todosRoute from "./todos.ts";
import clearNotificationsRoute from "./clearNotifications.ts";
import readNotificationsRoute from "./readNotifications.ts";
import publicProfileRouter from "./profile/[id].ts";
import meetingRouter from "./meeting/index.ts";
import { testingMiddleware } from "@/middleware/testing.ts";

const favicon = Buffer.from(
    "AAABAAEAEBAQAAAAAAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAA/4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEREQAAAAAAEAAAEAAAAAEAAAABAAAAEAAAAAAQAAAQAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD8HwAA++8AAPf3AADv+wAA7/sAAP//AAD//wAA+98AAP//AAD//wAA//8AAP//AAD//wAA",
    "base64"
);

const router = express.Router();

// Public routes
router.get("/hello", (_req, res) => {
    res.status(200).json({
        message: "Hello!",
    });
});

router.use("/contributors", contributorsRouter);
router.use("/profile/public", publicProfileRouter);

router.get("/favicon.ico", (_req, res) => {
    const headers = new Headers({
        "Content-Type": "image/x-icon",
        "Content-Length": favicon.length.toString(),
        "Cache-Control": "public, max-age=259200",
        Expires: new Date(Date.now() + 259200000).toUTCString(),
    });
    res.status(200).setHeaders(headers).send(favicon);
});

router.use("/f", fileRouter);

// Auth routes and middleware
router.use(authRouter);

router.use("/admin", adminRouter);
router.use(testingMiddleware);

router.use("/phd", phdRouter);
router.use("/handout", handoutRouter);
router.use("/conference", conferenceRouter);
router.use("/qp", qpRouter);
router.use("/publications", publicationsRouter);
router.use("/inventory", inventoryRouter);
router.use("/analytics", analyticsRouter);
router.use("/todos", todosRoute);
router.use("/clearNotifications", clearNotificationsRoute);
router.use("/readNotifications", readNotificationsRoute);
router.use("/profile", profileRouter);
router.use("/project", projectRouter);
router.use("/patent", patentRouter);
router.use("/wilpProject", wilpProjectRouter);
router.use("/meeting", meetingRouter);

export default router;
