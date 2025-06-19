import db from "@/config/db/index.ts";
import environment from "@/config/environment.ts";
import { conferenceSchemas } from "lib";
import type * as FormTables from "@/config/db/schema/form.ts";

const withFile = {
    with: {
        file: true,
    },
} as const;

export const getApplicationById = async (id: number) => {
    const application = await db.query.conferenceApprovalApplications.findFirst(
        {
            where: (app, { eq }) => eq(app.id, id),
            columns: {
                letterOfInvitation: false,
                firstPageOfPaper: false,
                reviewersComments: false,
                detailsOfEvent: false,
                otherDocuments: false,
            },
            with: {
                user: true,
                letterOfInvitation: withFile,
                firstPageOfPaper: withFile,
                reviewersComments: withFile,
                detailsOfEvent: withFile,
                otherDocuments: withFile,
            },
        }
    );
    if (!application) return undefined;

    for (const fileFieldName of conferenceSchemas.fileFieldNames) {
        const fileField = application[fileFieldName];
        if (!fileField) continue;
        // Weird bug in drizzle where the joined values doesn't have the correct types
        const fileID = fileField.fileId;
        (
            application[
                fileFieldName
            ] as typeof FormTables.fileFields.$inferSelect & {
                file: typeof FormTables.files.$inferSelect;
            }
        ).file.filePath = environment.SERVER_URL + "/f/" + fileID;
    }
    return {
        ...application,
        reimbursements: application.reimbursements as Array<{
            key: string;
            amount: string;
        }>,
        fundingSplit: application.fundingSplit as Array<{
            source: string;
            amount: string;
        }>,
    };
};

export type Application = Awaited<ReturnType<typeof getApplicationById>>;
