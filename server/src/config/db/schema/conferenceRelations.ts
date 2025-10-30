import { relations } from "drizzle-orm";
import {
    conferenceApprovalApplications,
    conferenceApplicationMembers,
} from "./conference.ts";
import { files } from "./form.ts";
import { users } from "./admin.ts";

export const conferenceApprovalApplicationRelations = relations(
    conferenceApprovalApplications,
    ({ one, many }) => ({
        user: one(users, {
            fields: [conferenceApprovalApplications.userEmail],
            references: [users.email],
            relationName: "conferenceApprovalApplicationUser",
        }),
        letterOfInvitation: one(files, {
            fields: [conferenceApprovalApplications.letterOfInvitationFileId],
            references: [files.id],
            relationName: "conferenceApprovalLetterOfInvitation",
        }),
        firstPageOfPaper: one(files, {
            fields: [conferenceApprovalApplications.firstPageOfPaperFileId],
            references: [files.id],
            relationName: "conferenceApprovalFirstPageOfPaper",
        }),
        reviewersComments: one(files, {
            fields: [conferenceApprovalApplications.reviewersCommentsFileId],
            references: [files.id],
            relationName: "conferenceApprovalReviewersComments",
        }),
        detailsOfEvent: one(files, {
            fields: [conferenceApprovalApplications.detailsOfEventFileId],
            references: [files.id],
            relationName: "conferenceApprovalDetailsOfEvent",
        }),
        otherDocuments: one(files, {
            fields: [conferenceApprovalApplications.otherDocumentsFileId],
            references: [files.id],
            relationName: "conferenceApprovalOtherDocuments",
        }),
        members: many(conferenceApplicationMembers, {
            relationName: "conferenceApprovalReviews",
        }),
    })
);

export const conferenceApplicationMembersRelations = relations(
    conferenceApplicationMembers,
    ({ one }) => ({
        application: one(conferenceApprovalApplications, {
            fields: [conferenceApplicationMembers.applicationId],
            references: [conferenceApprovalApplications.id],
            relationName: "conferenceApprovalReviews",
        }),
        user: one(users, {
            fields: [conferenceApplicationMembers.memberEmail],
            references: [users.email],
            relationName: "conferenceApplicationMemberUser",
        }),
    })
);
