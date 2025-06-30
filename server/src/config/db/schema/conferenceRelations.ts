import { relations } from "drizzle-orm";
import {
    conferenceApprovalApplications,
    conferenceMemberReviews,
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
        reviews: many(conferenceMemberReviews, {
            relationName: "conferenceApprovalReviews",
        }),
    })
);

export const conferenceMemberReviewsRelations = relations(
    conferenceMemberReviews,
    ({ one }) => ({
        conferenceApproval: one(conferenceApprovalApplications, {
            fields: [conferenceMemberReviews.applicationId],
            references: [conferenceApprovalApplications.id],
            relationName: "conferenceApprovalReviews",
        }),
    })
);
