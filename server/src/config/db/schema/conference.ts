import { pgTable, serial, integer, pgEnum } from "drizzle-orm/pg-core";
import {
    textFields,
    fileFields,
    applications,
    dateFields,
    numberFields,
} from "./form.ts";
import { conferenceSchemas } from "lib";

export const conferenceStateEnum = pgEnum(
    "conference_state_enum",
    conferenceSchemas.states
);

export const conferenceApprovalApplications = pgTable(
    "conference_approval_applications",
    {
        id: serial("id").primaryKey(),
        applicationId: integer("application_id")
            .notNull()
            .references(() => applications.id, { onDelete: "cascade" }),
        state: conferenceStateEnum("state")
            .notNull()
            .default(conferenceSchemas.states[0]),
        purpose: integer("purpose").references(() => textFields.id, {
            onDelete: "set null",
        }),
        contentTitle: integer("content_title").references(() => textFields.id, {
            onDelete: "set null",
        }),
        eventName: integer("event_name").references(() => textFields.id, {
            onDelete: "set null",
        }),
        venue: integer("venue").references(() => textFields.id, {
            onDelete: "set null",
        }),
        date: integer("date").references(() => dateFields.id, {
            onDelete: "set null",
        }),
        organizedBy: integer("organized_by").references(() => textFields.id, {
            onDelete: "set null",
        }),
        modeOfEvent: integer("mode_of_event").references(() => textFields.id, {
            onDelete: "set null",
        }),
        description: integer("description").references(() => textFields.id, {
            onDelete: "set null",
        }),
        travelReimbursement: integer("travel_reimbursement").references(
            () => numberFields.id,
            {
                onDelete: "set null",
            }
        ),
        registrationFeeReimbursement: integer(
            "registration_fee_reimbursement"
        ).references(() => numberFields.id, {
            onDelete: "set null",
        }),
        dailyAllowanceReimbursement: integer(
            "daily_allowance_reimbursement"
        ).references(() => numberFields.id, {
            onDelete: "set null",
        }),
        accomodationReimbursement: integer(
            "accomodation_reimbursement"
        ).references(() => numberFields.id, {
            onDelete: "set null",
        }),
        otherReimbursement: integer("other_reimbursement").references(
            () => numberFields.id,
            {
                onDelete: "set null",
            }
        ),
        letterOfInvitation: integer("letter_of_invitation").references(
            () => fileFields.id,
            {
                onDelete: "set null",
            }
        ),
        firstPageOfPaper: integer("first_page_of_paper").references(
            () => fileFields.id,
            {
                onDelete: "set null",
            }
        ),
        reviewersComments: integer("reviewers_comments").references(
            () => fileFields.id,
            {
                onDelete: "set null",
            }
        ),
        detailsOfEvent: integer("details_of_event").references(
            () => fileFields.id,
            {
                onDelete: "set null",
            }
        ),
        otherDocuments: integer("other_documents").references(
            () => fileFields.id,
            {
                onDelete: "set null",
            }
        ),
    }
);
