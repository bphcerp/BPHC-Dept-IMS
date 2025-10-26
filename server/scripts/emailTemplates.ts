// server/scripts/emailTemplates.ts
import db from "@/config/db/index.ts";
import { phdEmailTemplates } from "@/config/db/schema/phd.ts";
import environment from "@/config/environment.ts";

const createLoginPrompt = (context?: string) =>
    `Please log in to the IMS portal${context ? ` ${context}` : ""}: ${environment.FRONTEND_URL}`;

const defaultTemplates = [
    {
        name: "request_examiner_suggestions",
        subject: "Request for Examiner Suggestions for PhD Qualifying Exam",
        body: `Dear {{supervisorName}},\n\nPlease suggest a panel of examiners for the PhD qualifying exam for your student, **{{studentName}}**.\n\nYou are required to suggest **{{examinerCount}}** examiners for each of the two qualifying areas:\n1. **{{qualifyingArea1}}**\n2. **{{qualifyingArea2}}**\n\n${createLoginPrompt("to complete this task")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a supervisor to request examiner suggestions for the first time.",
    },
    {
        name: "reminder_examiner_suggestions",
        subject: "Reminder: Examiner Suggestions for PhD Qualifying Exam",
        body: `Dear {{supervisorName}},\n\nThis is a friendly reminder to please submit your suggestions for the examiner panel for your student, **{{studentName}}**.\n\nThe qualifying areas are:\n1. **{{qualifyingArea1}}**\n2. **{{qualifyingArea2}}**\n\n${createLoginPrompt("as soon as possible to complete this task")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a supervisor as a reminder if they have not submitted suggestions.",
    },
    {
        name: "notify_examiner_assignment",
        subject:
            "PhD Qualifying Exam Examiner Assignment for {{qualifyingArea}}",
        body: `Dear {{examinerName}},\n\nYou have been assigned as an examiner for the PhD qualifying exam for the student **{{studentName}}** in the area of "**{{qualifyingArea}}**".\n\nThe syllabus for the area is attached to this email.\n\n${createLoginPrompt("to prepare and submit your question paper at your earliest convenience")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a faculty member when they are assigned as an examiner.",
    },
    {
        name: "reminder_examiner_qp",
        subject: "Reminder: Question Paper Submission for {{qualifyingArea}}",
        body: `Dear {{examinerName}},\n\nThis is a reminder that your question paper for the qualifying area "**{{qualifyingArea}}**" for student **{{studentName}}** is still pending submission.\n\n${createLoginPrompt("to submit it as soon as possible")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to an assigned examiner as a reminder to submit the question paper.",
    },
    {
        name: "new_exam_announcement",
        subject: "New PhD Qualifying Exam Announced: {{examName}}",
        body: `Dear All,\n\nA new PhD Qualifying Exam "**{{examName}}**" has been scheduled for the **{{semesterYear}} Sem {{semesterNumber}}** semester.\n\nKey dates are as follows:\n- **Registration Deadline: **{{submissionDeadline}}\n- **Exam Period:** From {{examStartDate}} to {{examEndDate}}\n- **Viva Date:** {{vivaDate}}\n\nEligible students are requested to ${createLoginPrompt("to register before the deadline")}\n\nBest regards,\nPhD Department Office`,
        description:
            "Sent to all users when a new qualifying exam is created by staff.",
    },
    {
        name: "request_seminar_details",
        subject:
            "Action Required: Set PhD Proposal Seminar Details for {{studentName}}",
        body: `Dear {{supervisorName}},\n\nThe DAC has approved the PhD proposal for your student, **{{studentName}}**.\n\n${createLoginPrompt("to set the seminar details (Date, Time, Venue) for the student's proposal presentation")}\n\nThis will allow the DRC to generate the seminar notice.\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a supervisor to request them to set the seminar details for their student's proposal.",
    },
    {
        name: "reminder_seminar_details",
        subject:
            "Reminder: Set PhD Proposal Seminar Details for {{studentName}}",
        body: `Dear {{supervisorName}},\n\nThis is a friendly reminder to please set the seminar details for your student, **{{studentName}}**, whose proposal was recently approved by the DAC.\n\nSetting these details is required to proceed with the seminar notice.\n\n${createLoginPrompt("to set the details")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent as a reminder to a supervisor if they have not set the seminar details.",
    },
    {
        // --- THIS TEMPLATE IS UPDATED ---
        name: "proposal_deadlines_announcement",
        subject:
            "PhD Proposal Deadlines Announced for {{semesterYear}} Sem {{semesterNumber}}",
        body: `Dear All,\n\nPlease note the PhD Proposal deadlines for the **{{semesterYear}}Sem{{semesterNumber}}** have been announced.\n\n- Student Submission Deadline: **{{studentSubmissionDate}}**\n- Supervisor Review Deadline: **{{facultyReviewDate}}**\n- DRC Review Deadline: **{{drcReviewDate}}**\n- DAC Review Deadline: **{{dacReviewDate}}**\n\nThis time we will be collecting the proposal requests via the Information Management System (IMS) which is a portal developed for all department related processes. A demo for the students will also be conducted shortly.\n\nThe IMS can be accessed on ${environment.FRONTEND_URL}\n\nThis is the first time we would be using the IMS for proposal submission. In case of any bugs or difficulty, please email to parikshit@hyderabad.bits-pilani.ac.in with a copy to eee.temp@hyderabad.bits-pilani.ac.in and a.bhattacharjee@hyderabad.bits-pilani.ac.in\n\nPlease plan your submissions and reviews accordingly and submit well in advance.\n\n-Regards\n\nOn behalf of DRC Convenor, Dept. of EEE, BITS Pilani, Hyderabad Campus,\n\nAnkur Bhattacharjee`,
        description:
            "Sent to all users when new proposal deadlines are created by staff.",
    },
    {
        name: "reminder_student_draft",
        subject: "Reminder: Complete Your PhD Proposal Draft",
        body: `Dear Student,\n\nThis is a reminder that you have one or more PhD proposals still in 'Draft' status. Please complete and submit them for supervisor review before the deadline.\n\n${createLoginPrompt("to continue your submission")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to students to remind them to finalize their draft proposal(s).",
    },
    {
        name: "reminder_supervisor_review",
        subject: "Reminder: PhD Proposal Review(s) Awaiting Action",
        body: `Dear Supervisor,\n\nThis is a reminder that one or more PhD proposals submitted by your student(s) are awaiting your review and DAC member suggestions.\n\n${createLoginPrompt("to review the proposals")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a supervisor to remind them to review submitted proposal(s).",
    },
    {
        name: "reminder_drc_review",
        subject: "Reminder: PhD Proposal DRC Review(s) Awaiting Action",
        body: `Dear {{drcConvenerName}},\n\nThis is a reminder that one or more PhD proposals are awaiting your review to finalize the DAC members.\n\n${createLoginPrompt("to review the proposals")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to the DRC convenor to remind them to finalize DAC(s).",
    },
    {
        name: "reminder_dac_review",
        subject: "Reminder: PhD Proposal DAC Evaluation(s) Awaiting Action",
        body: `Dear {{dacMemberName}},\n\nThis is a friendly reminder to please submit your evaluation for one or more PhD proposals assigned to you.\n\nYour feedback is required to move the process forward.\n\n${createLoginPrompt("to submit your review")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a DAC member to remind them to submit evaluation(s).",
    },
    {
        name: "reminder_supervisor_revert_student",
        subject: "Reminder: Action Required on Your PhD Proposal",
        body: `Dear Student,\n\nThis is a reminder that your PhD proposal was reverted by your supervisor with comments.\n\nPlease review the feedback and resubmit your proposal.\n\n${createLoginPrompt("to view comments and resubmit")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a student when their proposal was reverted by their supervisor.",
    },
    {
        name: "reminder_drc_revert_student",
        subject: "Reminder: Action Required on Your PhD Proposal",
        body: `Dear Student,\n\nThis is a reminder that your PhD proposal was reverted by the DRC with comments.\n\nPlease review the feedback and resubmit your proposal.\n\n${createLoginPrompt("to view comments and resubmit")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a student when their proposal was reverted by the DRC.",
    },
    {
        name: "reminder_dac_revert_student",
        subject: "Reminder: Action Required on Your PhD Proposal",
        body: `Dear Student,\n\nThis is a reminder that your PhD proposal was reverted by the DAC with comments.\n\nPlease review the feedback from the committee and resubmit your proposal.\n\n${createLoginPrompt("to view comments and resubmit")}\n\nBest regards,\nDRC Committee`,
        description:
            "Sent to a student when their proposal was reverted by the DAC.",
    },
];

export const seedEmailTemplates = async () => {
    console.log("Seeding email templates (if they don't exist)...");
    await db
        .insert(phdEmailTemplates)
        .values(defaultTemplates)
        .onConflictDoNothing({ target: phdEmailTemplates.name });
    console.log("Email templates seeding complete.");
};
