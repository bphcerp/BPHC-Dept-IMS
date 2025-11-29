import db from "@/config/db/index.ts";
import environment from "@/config/environment.ts";
import { conferenceSchemas } from "lib";

export const getApplicationWithFilePaths = async (id: number) => {
    const application = await db.query.conferenceApprovalApplications.findFirst(
        {
            where: (app, { eq }) => eq(app.id, id),
            with: {
                user: true,
                members: true,
                letterOfInvitation: true,
                firstPageOfPaper: true,
                reviewersComments: true,
                detailsOfEvent: true,
                otherDocuments: true,
            },
        }
    );
    if (!application) return undefined;

    const { members, ...rest } = application;

    return {
        ...rest,
        membersAssigned: members.length > 0,
        modeOfEvent:
            application.modeOfEvent as (typeof conferenceSchemas.modesOfEvent)[number],
        approvalForm: application.approvalFormFileId
            ? environment.SERVER_URL + "/f/" + application.approvalFormFileId
            : undefined,
        reimbursements: application.reimbursements as Array<{
            key: string;
            amount: string;
        }>,
        fundingSplit: application.fundingSplit as Array<{
            source: string;
            amount: string;
        }>,
        requestEdit: application.requestEdit,
        requestDelete: application.requestDelete,
    };
};

export const getApplicationWithFileUrls = async (id: number) => {
    const application = await getApplicationWithFilePaths(id);
    if (!application) return undefined;

    const fileUrls = Object.fromEntries(
        conferenceSchemas.fileFieldNames.map((fieldName) => [
            fieldName,
            application[fieldName]
                ? ({
                      fileName: application[fieldName].originalName ?? "file",
                      url:
                          environment.SERVER_URL +
                          "/f/" +
                          application[fieldName].id,
                  } satisfies conferenceSchemas.File)
                : undefined,
        ])
    ) as Record<
        (typeof conferenceSchemas.fileFieldNames)[number],
        conferenceSchemas.File | undefined
    >;

    return {
        ...application,
        ...fileUrls,
    } satisfies conferenceSchemas.ViewApplicationResponse["application"];
};

export const getApplicationById = async (id: number) => {
    return await db.query.conferenceApprovalApplications.findFirst({
        where: (app, { eq }) => eq(app.id, id),
        with: { user: true },
    });
};
