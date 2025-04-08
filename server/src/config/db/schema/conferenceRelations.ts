import { relations } from "drizzle-orm";
import { conferenceApprovalApplications } from "./conference.ts";
import {
    applications,
    dateFields,
    fileFields,
    numberFields,
    textFields,
} from "./form.ts";

export const conferenceApprovalApplicationRelations = relations(
    conferenceApprovalApplications,
    ({ one }) => ({
        application: one(applications, {
            fields: [conferenceApprovalApplications.applicationId],
            references: [applications.id],
            relationName: "conferenceApprovalApplications",
        }),
        purpose: one(textFields, {
            fields: [conferenceApprovalApplications.purpose],
            references: [textFields.id],
            relationName: "conferenceApprovalPurpose",
        }),
        contentTitle: one(textFields, {
            fields: [conferenceApprovalApplications.contentTitle],
            references: [textFields.id],
            relationName: "conferenceApprovalContentTitle",
        }),
        eventName: one(textFields, {
            fields: [conferenceApprovalApplications.eventName],
            references: [textFields.id],
            relationName: "conferenceApprovalEventName",
        }),
        venue: one(textFields, {
            fields: [conferenceApprovalApplications.venue],
            references: [textFields.id],
            relationName: "conferenceApprovalVenue",
        }),
        date: one(dateFields, {
            fields: [conferenceApprovalApplications.date],
            references: [dateFields.id],
            relationName: "conferenceApprovalDate",
        }),
        organizedBy: one(textFields, {
            fields: [conferenceApprovalApplications.organizedBy],
            references: [textFields.id],
            relationName: "conferenceApprovalOrganizedBy",
        }),
        modeOfEvent: one(textFields, {
            fields: [conferenceApprovalApplications.modeOfEvent],
            references: [textFields.id],
            relationName: "conferenceApprovalModeOfEvent",
        }),
        description: one(textFields, {
            fields: [conferenceApprovalApplications.description],
            references: [textFields.id],
            relationName: "conferenceApprovalDescription",
        }),
        travelReimbursement: one(numberFields, {
            fields: [conferenceApprovalApplications.travelReimbursement],
            references: [numberFields.id],
            relationName: "conferenceApprovalTravelReimbursement",
        }),
        registrationFeeReimbursement: one(numberFields, {
            fields: [
                conferenceApprovalApplications.registrationFeeReimbursement,
            ],
            references: [numberFields.id],
            relationName: "conferenceApprovalRegistrationFeeReimbursement",
        }),
        dailyAllowanceReimbursement: one(numberFields, {
            fields: [
                conferenceApprovalApplications.dailyAllowanceReimbursement,
            ],
            references: [numberFields.id],
            relationName: "conferenceApprovalDailyAllowanceReimbursement",
        }),
        accommodationReimbursement: one(numberFields, {
            fields: [conferenceApprovalApplications.accommodationReimbursement],
            references: [numberFields.id],
            relationName: "conferenceApprovalAccommodationReimbursement",
        }),
        otherReimbursement: one(numberFields, {
            fields: [conferenceApprovalApplications.otherReimbursement],
            references: [numberFields.id],
            relationName: "conferenceApprovalOtherReimbursement",
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
    })
);
