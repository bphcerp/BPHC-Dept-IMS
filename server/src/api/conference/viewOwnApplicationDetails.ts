import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import type * as FormTables from "@/config/db/schema/form.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { and, eq } from "drizzle-orm";
import { conferenceSchemas } from "lib";
import environment from "@/config/environment.ts";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));
        }

        const application = await db.query.applications.findFirst({
            where: (app) =>
                and(eq(app.id, id), eq(app.userEmail, req.user!.email)),
            with: {
                user: true,
                statuses: true,
                conferenceApplications: {
                    columns: {},
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
                application.conferenceApplications[0][fileFieldName];
            if (!fileField) continue;

            // Weird bug in drizzle where the joined values doesn't have the correct types
            const fileID = fileField.fileId;
            (
                application.conferenceApplications[0][
                    fileFieldName
                ] as typeof FormTables.fileFields.$inferSelect & {
                    file: typeof FormTables.files.$inferSelect;
                }
            ).file.filePath = environment.SERVER_URL + "/api/f/" + fileID;
        }

        res.status(200).send(application);
    })
);

export default router;
