import { relations } from "drizzle-orm";
import {
    conferenceApprovalApplications,
    conferenceMemberReviews,
} from "./conference.ts";
import { fileFields } from "./form.ts";
import { users } from "./admin.ts";

export const conferenceApprovalApplicationRelations = relations(
    conferenceApprovalApplications,
    ({ one, many }) => ({
        user: one(users, {
            fields: [conferenceApprovalApplications.userEmail],
            references: [users.email],
            relationName: "conferenceApprovalApplicationUser",
        }),
        letterOfInvitation: one(fileFields, {
            fields: [conferenceApprovalApplications.letterOfInvitation],
            references: [fileFields.id],
            relationName: "conferenceApprovalLetterOfInvitation",
        }),
        firstPageOfPaper: one(fileFields, {
            fields: [conferenceApprovalApplications.firstPageOfPaper],
            references: [fileFields.id],
            relationName: "conferenceApprovalFirstPageOfPaper",
        }),
        reviewersComments: one(fileFields, {
            fields: [conferenceApprovalApplications.reviewersComments],
            references: [fileFields.id],
            relationName: "conferenceApprovalReviewersComments",
        }),
        detailsOfEvent: one(fileFields, {
            fields: [conferenceApprovalApplications.detailsOfEvent],
            references: [fileFields.id],
            relationName: "conferenceApprovalDetailsOfEvent",
        }),
        otherDocuments: one(fileFields, {
            fields: [conferenceApprovalApplications.otherDocuments],
            references: [fileFields.id],
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
