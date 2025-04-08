import db from "@/config/db/index.ts";
import environment from "@/config/environment.ts";
import { conferenceSchemas, modules } from "lib";
import type * as FormTables from "@/config/db/schema/form.ts";
import type { PgColumn } from "drizzle-orm/pg-core";
import { desc } from "drizzle-orm";

const withStatus = {
    with: {
        statuses: {
            columns: {
                timestamp: true,
                status: true,
                comments: true,
            },
            orderBy: ({ timestamp }: { timestamp: PgColumn }) => [
                desc(timestamp),
            ],
        },
    },
} as const;

export const getApplicationById = async (id: number) => {
    const application = await db.query.applications.findFirst({
        where: (app, { and, eq }) =>
            and(eq(app.id, id), eq(app.module, modules[0])),
        with: {
            user: true,
            statuses: true,
            conferenceApplications: {
                columns: {
                    state: true,
                },
                with: {
                    purpose: withStatus,
                    contentTitle: withStatus,
                    eventName: withStatus,
                    venue: withStatus,
                    date: withStatus,
                    organizedBy: withStatus,
                    modeOfEvent: withStatus,
                    description: withStatus,
                    travelReimbursement: withStatus,
                    registrationFeeReimbursement: withStatus,
                    dailyAllowanceReimbursement: withStatus,
                    accommodationReimbursement: withStatus,
                    otherReimbursement: withStatus,
                    letterOfInvitation: {
                        with: { ...withStatus.with, file: true },
                    },
                    firstPageOfPaper: {
                        with: { ...withStatus.with, file: true },
                    },
                    reviewersComments: {
                        with: { ...withStatus.with, file: true },
                    },
                    detailsOfEvent: {
                        with: { ...withStatus.with, file: true },
                    },
                    otherDocuments: {
                        with: { ...withStatus.with, file: true },
                    },
                },
            },
        },
    });
    if (application?.conferenceApplications.length) {
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
            ).file.filePath = environment.SERVER_URL + "/f/" + fileID;
        }
        const { conferenceApplications, ...rest } = application;
        return {
            ...rest,
            conferenceApplication: {
                ...conferenceApplications[0],
            },
        };
    }
    return undefined;
};

export type Application = Awaited<ReturnType<typeof getApplicationById>>;

export const areAllFieldsApprovedForApplication = async (
    application: Application
) => {
    if (!application) return false;
    for (const field of Object.values(application.conferenceApplication)) {
        if (
            !field ||
            typeof field !== "object" ||
            !Object.hasOwn(field, "statuses")
        )
            continue;
        const fieldStatuses = field as unknown as {
            statuses: {
                status: boolean;
            }[];
        };
        if (
            !fieldStatuses?.statuses?.length ||
            !fieldStatuses.statuses[0].status
        )
            return false;
    }
    return true;
};
