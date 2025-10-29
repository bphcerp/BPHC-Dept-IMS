import db from "@/config/db/index.ts";
import {
    conferenceApprovalApplications,
    conferenceGlobal,
} from "@/config/db/schema/conference.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq, inArray } from "drizzle-orm";
import { conferenceSchemas, modules } from "lib";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { bulkGenerateAndMailForms } from "@/lib/conference/form.ts";

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
                const convenerApplications = await tx
                    .update(conferenceApprovalApplications)
                    .set({ state: "DRC Convener" })
                    .where(
                        inArray(
                            conferenceApprovalApplications.id,
                            memberApplications
                        )
                    )
                    .returning();
                if (convenerApplications.length) {
                    await completeTodo(
                        {
                            module: modules[0],
                            completionEvent: convenerApplications.map(
                                (app) => `review ${app.id} member`
                            ),
                        },
                        tx
                    );
                    const todoAssignees = await getUsersWithPermission(
                        "conference:application:convener",
                        tx
                    );
                    const todos: Parameters<typeof createTodos>[0] = [];
                    for (const assignee of todoAssignees) {
                        for (const inserted of convenerApplications) {
                            todos.push({
                                module: modules[0],
                                title: "Conference Application",
                                createdBy: inserted.userEmail,
                                completionEvent: `review ${inserted.id} convener`,
                                description: `Review conference application id ${inserted.id} by ${inserted.userEmail}`,
                                assignedTo: assignee.email,
                                link: `/conference/view/${inserted.id}`,
                            });
                        }
                    }
                    await createTodos(todos, tx);
                }

                const hodApplications = tx
                    .select({
                        applicationId: conferenceApprovalApplications.id,
                    })
                    .from(conferenceApprovalApplications)
                    .where(eq(conferenceApprovalApplications.state, "HoD"));
                const completedApplications = await tx
                    .update(conferenceApprovalApplications)
                    .set({ state: "Completed" })
                    .where(
                        inArray(
                            conferenceApprovalApplications.id,
                            hodApplications
                        )
                    )
                    .returning();
                if (completedApplications.length) {
                    await completeTodo(
                        {
                            module: modules[0],
                            completionEvent: completedApplications.map(
                                (app) => `review ${app.id} hod`
                            ),
                        },
                        tx
                    );
                    await bulkGenerateAndMailForms(
                        completedApplications.map((app) => app.id)
                    );
                }
            }
            // If we are moving to normal flow, move all DRC Convener states to DRC Member state for applications that dont have members selected
            // or for those applications where there are pending member reviews
            else {
                const applications =
                    await tx.query.conferenceApprovalApplications.findMany({
                        where: (cols, { eq }) => eq(cols.state, "DRC Convener"),
                        with: {
                            members: true,
                        },
                    });
                const toBeUpdated = applications
                    .filter(
                        (app) =>
                            app.members.length === 0 ||
                            app.members.some(
                                (member) => member.reviewStatus === null
                            )
                    )
                    .map((app) => app.id);
                await db
                    .update(conferenceApprovalApplications)
                    .set({
                        state: "DRC Member",
                    })
                    .where(
                        inArray(conferenceApprovalApplications.id, toBeUpdated)
                    );
            }

            return await tx.update(conferenceGlobal).set({
                key: "directFlow",
                value: String(body.directFlow),
            });
        });

        res.status(200).send();
    })
);

export default router;
