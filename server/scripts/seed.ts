import db from "@/config/db/index.ts";
import {
    faculty,
    permissions,
    roles,
    users,
} from "@/config/db/schema/admin.ts";
import { notInArray } from "drizzle-orm";
import { allPermissions } from "lib";
import { phdEmailTemplates } from "@/config/db/schema/phd.ts";

const defaultTemplates = [
    {
        name: "request_examiner_suggestions",
        subject: "Request for Examiner Suggestions for PhD Qualifying Exam",
        body: `Dear {{supervisorName}},\n\nPlease suggest a panel of examiners for the PhD qualifying exam for your student, **{{studentName}}**.\n\nYou are required to suggest **{{examinerCount}}** examiners for each of the two qualifying areas:\n1. **{{qualifyingArea1}}**\n2. **{{qualifyingArea2}}**\n\nPlease complete this task by visiting the supervisor portal: [Click Here]({{link}})\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a supervisor to request examiner suggestions for the first time.",
    },
    {
        name: "reminder_examiner_suggestions",
        subject: "Reminder: Examiner Suggestions for PhD Qualifying Exam",
        body: `Dear {{supervisorName}},\n\nThis is a friendly reminder to please submit your suggestions for the examiner panel for your student, **{{studentName}}**.\n\nThe qualifying areas are:\n1. **{{qualifyingArea1}}**\n2. **{{qualifyingArea2}}**\n\nPlease complete this task as soon as possible by visiting the supervisor portal: [Click Here]({{link}})\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a supervisor as a reminder if they have not submitted suggestions.",
    },
    {
        name: "notify_examiner_assignment",
        subject:
            "PhD Qualifying Exam Examiner Assignment for {{qualifyingArea}}",
        body: `Dear {{examinerName}},\n\nYou have been assigned as an examiner for the PhD qualifying exam for the student **{{studentName}}** in the area of "**{{qualifyingArea}}**".\n\nThe syllabus for the area is attached to this email.\n\nPlease prepare a question paper and submit it through the portal at your earliest convenience.\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a faculty member when they are assigned as an examiner.",
    },
    {
        name: "reminder_examiner_qp",
        subject: "Reminder: Question Paper Submission for {{qualifyingArea}}",
        body: `Dear {{examinerName}},\n\nThis is a reminder that your question paper for the qualifying area "**{{qualifyingArea}}**" for student **{{studentName}}** is still pending submission.\n\nPlease submit it as soon as possible.\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to an assigned examiner as a reminder to submit the question paper.",
    },
    {
        name: "new_exam_announcement",
        subject: "New PhD Qualifying Exam Announced: {{examName}}",
        body: `Dear All,\n\nA new PhD Qualifying Exam "**{{examName}}**" has been scheduled for the **{{semesterYear}} Sem {{semesterNumber}}** semester.\n\nKey dates are as follows:\n- **Registration Deadline: **{{submissionDeadline}}\n- **Exam Period:** From {{examStartDate}} to {{examEndDate}}\n- **Viva Date:** {{vivaDate}}\n\nEligible students are requested to register before the deadline.\n\nBest regards,\nPhD Department Office`,
        description:
            "Sent to all users when a new qualifying exam is created by staff.",
    },
    {
        name: "request_seminar_details",
        subject:
            "Action Required: Set PhD Proposal Seminar Details for {{studentName}}",
        body: `Dear {{supervisorName}},\n\nThe DAC has approved the PhD proposal for your student, **{{studentName}}**.\n\nPlease set the seminar details (Date, Time, Venue) for the student's proposal presentation by visiting the supervisor portal: [Click Here]({{link}})\n\nThis will allow the DRC to generate the seminar notice.\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a supervisor to request them to set the seminar details for their student's proposal.",
    },
    {
        name: "reminder_seminar_details",
        subject:
            "Reminder: Set PhD Proposal Seminar Details for {{studentName}}",
        body: `Dear {{supervisorName}},\n\nThis is a friendly reminder to please set the seminar details for your student, **{{studentName}}**, whose proposal was recently approved by the DAC.\n\nSetting these details is required to proceed with the seminar notice.\n\nYou can set the details here: [Click Here]({{link}})\n\nBest regards,\nDRC Committee`,
        description:
            "Sent as a reminder to a supervisor if they have not set the seminar details.",
    },
    {
        name: "proposal_deadlines_announcement",
        subject:
            "PhD Proposal Deadlines Announced for {{semesterYear}} Sem {{semesterNumber}}",
        body: `Dear BITS Community,\n\nPlease note the PhD Proposal deadlines for the **{{semesterYear}}Sem{{semesterNumber}}** have been announced.\n\n- **Student Submission Deadline:**{{studentSubmissionDate}}\n- **Supervisor Review Deadline:**{{facultyReviewDate}}\n- **DRC Review Deadline:**{{drcReviewDate}}\n- **DAC Review Deadline:**{{dacReviewDate}}\n\nPlease plan your submissions and reviews accordingly.`,
        description:
            "Sent to all users when new proposal deadlines are created by staff.",
    },
    {
        name: "reminder_student_draft",
        subject: "Reminder: Complete Your PhD Proposal Draft",
        body: `Dear Student,\n\nThis is a reminder that you have one or more PhD proposals still in 'Draft' status. Please complete and submit them for supervisor review before the deadline.\n\nYou can continue your submission here:\n{{link}}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to students to remind them to finalize their draft proposal(s).",
    },
    {
        name: "reminder_supervisor_review",
        subject: "Reminder: PhD Proposal Review(s) Awaiting Action",
        body: `Dear Supervisor,\n\nThis is a reminder that one or more PhD proposals submitted by your student(s) are awaiting your review and DAC member suggestions.\n\nYou can review the proposals here:\n{{link}}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a supervisor to remind them to review submitted proposal(s).",
    },
    {
        name: "reminder_drc_review",
        subject: "Reminder: PhD Proposal DRC Review(s) Awaiting Action",
        body: `Dear {{drcConvenerName}},\n\nThis is a reminder that one or more PhD proposals are awaiting your review to finalize the DAC members.\n\nYou can review the proposals here:\n{{link}}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to the DRC convenor to remind them to finalize DAC(s).",
    },
    {
        name: "reminder_dac_review",
        subject: "Reminder: PhD Proposal DAC Evaluation(s) Awaiting Action",
        body: `Dear {{dacMemberName}},\n\nThis is a friendly reminder to please submit your evaluation for one or more PhD proposals assigned to you.\n\nYour feedback is required to move the process forward.\n\nYou can submit your review here:\n{{link}}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a DAC member to remind them to submit evaluation(s).",
    },
    {
        name: "reminder_supervisor_revert_student",
        subject: "Reminder: Action Required on Your PhD Proposal",
        body: `Dear Student,\n\nThis is a reminder that your PhD proposal was reverted by your supervisor with comments.\n\nPlease review the feedback and resubmit your proposal.\n\nYou can view the comments and resubmit here:\n{{link}}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a student when their proposal was reverted by their supervisor.",
    },
    {
        name: "reminder_drc_revert_student",
        subject: "Reminder: Action Required on Your PhD Proposal",
        body: `Dear Student,\n\nThis is a reminder that your PhD proposal was reverted by the DRC with comments.\n\nPlease review the feedback and resubmit your proposal.\n\nYou can view the comments and resubmit here:\n{{link}}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a student when their proposal was reverted by the DRC.",
    },
    {
        name: "reminder_dac_revert_student",
        subject: "Reminder: Action Required on Your PhD Proposal",
        body: `Dear Student,\n\nThis is a reminder that your PhD proposal was reverted by the DAC with comments.\n\nPlease review the feedback from the committee and resubmit your proposal.\n\nYou can view the comments and resubmit here:\n{{link}}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a student when their proposal was reverted by the DAC.",
    },
];

const seedData = async (email?: string) => {
    await db
        .delete(permissions)
        .where(notInArray(permissions.permission, Object.keys(allPermissions)));
    await db
        .insert(permissions)
        .values(
            Object.entries(allPermissions).map(([key, value]) => ({
                permission: key,
                description: value,
            }))
        )
        .onConflictDoNothing();
    const insertedRoles = await db
        .insert(roles)
        .values({
            roleName: "developer",
            allowed: ["*"],
        })
        .onConflictDoNothing()
        .returning();
    if (email) {
        await db
            .insert(users)
            .values({
                email,
                type: "faculty",
                roles: [insertedRoles[0]?.id ?? 1],
            })
            .onConflictDoNothing();
        await db
            .insert(faculty)
            .values({
                email,
            })
            .onConflictDoNothing();
    }

    await db
        .insert(phdEmailTemplates)
        .values(defaultTemplates)
        .onConflictDoNothing({ target: phdEmailTemplates.name });
};

const args = process.argv.slice(2);

console.log("Seeding data...");
await seedData(args.length ? args[0] : undefined);
