// server/src/api/meeting/getAllUsers.ts
import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { users } from "@/config/db/schema/admin.ts";
import { meetingParticipants } from "@/config/db/schema/meeting.ts";
import { eq, and, inArray } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("meeting:use"),
    asyncHandler(async (req, res) => {
        const organizerEmail = req.user!.email;
        const meetingId = req.query.meetingId
            ? parseInt(req.query.meetingId as string, 10)
            : null;

        let existingEmails: string[] = [organizerEmail];

        if (meetingId && !isNaN(meetingId)) {
            const existingParticipants = await db
                .select({ email: meetingParticipants.participantEmail })
                .from(meetingParticipants)
                .where(eq(meetingParticipants.meetingId, meetingId));
            existingEmails.push(...existingParticipants.map((p) => p.email));
        }

        const allUsers = await db.query.users.findMany({
            where: and(
                eq(users.deactivated, false),
                inArray(users.type, ["faculty", "staff"])
            ),
            columns: {
                name: true,
                email: true,
            },
            orderBy: (users, { asc }) => [asc(users.name)],
        });

        res.status(200).json(allUsers);
    })
);

export default router;
