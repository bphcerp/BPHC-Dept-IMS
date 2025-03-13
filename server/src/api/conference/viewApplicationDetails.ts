import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import type * as FormTables from "@/config/db/schema/form.ts";
import type * as ConferenceTables from "@/config/db/schema/conference.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import { conferenceSchemas } from "lib";
import environment from "@/config/environment.ts";

const router = express.Router();

router.get(
    "/:id",
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));
        }

        const application = await db.query.applications.findFirst({
            where: (app) => eq(app.id, id),
            with: {
                user: true,
                statuses: true,
                conferenceApplications: {
                    with: {
                        purpose: {
                            with: {
                                statuses: true,
                            },
                        },
                        contentTitle: {
                            with: {
                                statuses: true,
                            },
                        },
                        eventName: {
                            with: {
                                statuses: true,
                            },
                        },
                        venue: {
                            with: {
                                statuses: true,
                            },
                        },
                        date: {
                            with: {
                                statuses: true,
                            },
                        },
                        organizedBy: {
                            with: {
                                statuses: true,
                            },
                        },
                        modeOfEvent: {
                            with: {
                                statuses: true,
                            },
                        },
                        description: {
                            with: {
                                statuses: true,
                            },
                        },
                        travelReimbursement: {
                            with: {
                                statuses: true,
                            },
                        },
                        registrationFeeReimbursement: {
                            with: {
                                statuses: true,
                            },
                        },
                        dailyAllowanceReimbursement: {
                            with: {
                                statuses: true,
                            },
                        },
                        accomodationReimbursement: {
                            with: {
                                statuses: true,
                            },
                        },
                        otherReimbursement: {
                            with: {
                                statuses: true,
                            },
                        },
                        letterOfInvitation: {
                            with: {
                                statuses: true,
                                file: true,
                            },
                        },
                        firstPageOfPaper: {
                            with: {
                                statuses: true,
                                file: true,
                            },
                        },
                        reviewersComments: {
                            with: {
                                statuses: true,
                                file: true,
                            },
                        },
                        detailsOfEvent: {
                            with: {
                                statuses: true,
                                file: true,
                            },
                        },
                        otherDocuments: {
                            with: {
                                statuses: true,
                                file: true,
                            },
                        },
                    },
                },
            },
        });

        if (!application || application.conferenceApplications.length === 0) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );
        }

        for (const fileFieldName of conferenceSchemas.fileFieldNames) {
            const fileField =
                application.conferenceApplications[0][
                    fileFieldName as keyof typeof ConferenceTables.conferenceApprovalApplications.$inferSelect
                ];
            if (fileField === null) continue;
            if (typeof fileField === "number") {
                return next(
                    new HttpError(
                        HttpCode.INTERNAL_SERVER_ERROR,
                        `Could not find fileField ${fileFieldName}`
                    )
                );
            }
            // Weird bug in drizzle where the joined values doesn't have the correct types
            const fileID = (
                (fileField as typeof FormTables.fileFields.$inferSelect)
                    .file as unknown as typeof FormTables.files.$inferSelect
            ).id;
            (
                (
                    application.conferenceApplications[0][
                        fileFieldName as keyof typeof ConferenceTables.conferenceApprovalApplications.$inferSelect
                    ] as typeof FormTables.fileFields.$inferSelect
                ).file as unknown as typeof FormTables.files.$inferSelect
            ).filePath = environment.SERVER_URL + "/api/f/" + fileID;
        }

        res.status(200).send(application);
    })
);

export default router;
