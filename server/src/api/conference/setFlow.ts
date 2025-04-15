import db from "@/config/db/index.ts";
import {
    conferenceApprovalApplications,
    conferenceGlobal,
    conferenceMemberReviews,
} from "@/config/db/schema/conference.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq, inArray } from "drizzle-orm";
import { conferenceSchemas } from "lib";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const body = conferenceSchemas.flowBodySchema.parse(req.body);

        const current = await db.query.conferenceGlobal.findFirst({
            where: (conferenceGlobal, { eq }) =>
                eq(conferenceGlobal.key, "directFlow"),
        });
        if (!current) {
            await db.insert(conferenceGlobal).values({
                key: "directFlow",
                value: "false",
            });
        }

        if (
            (current && current?.value === String(body.directFlow)) ||
            (!current && body.directFlow === false)
        ) {
            res.status(200).send();
            return;
        }

        await db.transaction(async (tx) => {
            if (body.directFlow) {
                // If we are moving to direct flow, DRC Member states must be set to DRC Convener, and HoD states must be set to Completed
                const memberApplications = tx
                    .select({
                        applicationId: conferenceApprovalApplications.id,
                    })
                    .from(conferenceApprovalApplications)
                    .where(
                        eq(conferenceApprovalApplications.state, "DRC Member")
                    );
                await tx
                    .delete(conferenceMemberReviews)
                    .where(
                        inArray(
                            conferenceMemberReviews.applicationId,
                            memberApplications
                        )
                    );
                await tx
                    .update(conferenceApprovalApplications)
                    .set({ state: "DRC Convener" })
                    .where(
                        inArray(
                            conferenceApprovalApplications.id,
                            memberApplications
                        )
                    );

                const hodApplications = tx
                    .select({
                        applicationId: conferenceApprovalApplications.id,
                    })
                    .from(conferenceApprovalApplications)
                    .where(eq(conferenceApprovalApplications.state, "HoD"));
                await tx
                    .delete(conferenceMemberReviews)
                    .where(
                        inArray(
                            conferenceMemberReviews.applicationId,
                            hodApplications
                        )
                    );
                await tx
                    .update(conferenceApprovalApplications)
                    .set({ state: "Completed" })
                    .where(
                        inArray(
                            conferenceApprovalApplications.id,
                            hodApplications
                        )
                    );
            }
            // If we are moving to normal flow, everything can stay as it is

            return await tx.update(conferenceGlobal).set({
                key: "directFlow",
                value: String(body.directFlow),
            });
        });

        res.status(200).send();
    })
);

export default router;
