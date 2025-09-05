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
    body: `Dear {{supervisorName}},<br><br>
Please suggest a panel of examiners for the PhD qualifying exam for your student, <strong>{{studentName}}</strong>.<br><br>
You are required to suggest <strong>{{examinerCount}}</strong> examiners for each of the two qualifying areas:<br>
<ol>
  <li><strong>{{qualifyingArea1}}</strong></li>
  <li><strong>{{qualifyingArea2}}</strong></li>
</ol>
Please complete this task by visiting the supervisor portal: <a href="{{link}}">Click Here</a><br><br>
Best regards,<br>DRC Committee`,
    description: "Sent to a supervisor to request examiner suggestions for the first time.",
  },
  {
    name: "reminder_examiner_suggestions",
    subject: "Reminder: Examiner Suggestions for PhD Qualifying Exam",
    body: `Dear {{supervisorName}},<br><br>
This is a friendly reminder to please submit your suggestions for the examiner panel for your student, <strong>{{studentName}}</strong>.<br><br>
The qualifying areas are:<br>
<ol>
  <li><strong>{{qualifyingArea1}}</strong></li>
  <li><strong>{{qualifyingArea2}}</strong></li>
</ol>
Please complete this task as soon as possible by visiting the supervisor portal: <a href="{{link}}">Click Here</a><br><br>
Best regards,<br>DRC Committee`,
    description: "Sent to a supervisor as a reminder if they have not submitted suggestions.",
  },
  {
    name: "notify_examiner_assignment",
    subject: "PhD Qualifying Exam Examiner Assignment for {{qualifyingArea}}",
    body: `Dear {{examinerName}},<br><br>
You have been assigned as an examiner for the PhD qualifying exam for the student <strong>{{studentName}}</strong> in the area of "<strong>{{qualifyingArea}}</strong>".<br><br>
The syllabus for the area is attached to this email.<br><br>
Please prepare a question paper and submit it through the portal at your earliest convenience.<br><br>
Best regards,<br>DRC Committee`,
    description: "Sent to a faculty member when they are assigned as an examiner.",
  },
  {
    name: "reminder_examiner_qp",
    subject: "Reminder: Question Paper Submission for {{qualifyingArea}}",
    body: `Dear {{examinerName}},<br><br>
This is a reminder that your question paper for the qualifying area "<strong>{{qualifyingArea}}</strong>" for student <strong>{{studentName}}</strong> is still pending submission.<br><br>
Please submit it as soon as possible.<br><br>
Best regards,<br>DRC Committee`,
    description: "Sent to an assigned examiner as a reminder to submit the question paper.",
  },
  {
    name: "new_exam_announcement",
    subject: "New PhD Qualifying Exam Announced: {{examName}}",
    body: `Dear All,<br><br>
A new PhD Qualifying Exam "<strong>{{examName}}</strong>" has been scheduled for the <strong>{{semesterYear}} Sem {{semesterNumber}}</strong> semester.<br><br>
Key dates are as follows:
<ul>
  <li><strong>Registration Deadline:</strong> {{submissionDeadline}}</li>
  <li><strong>Exam Period:</strong> From {{examStartDate}} to {{examEndDate}}</li>
  <li><strong>Viva Date:</strong> {{vivaDate}}</li>
</ul>
Eligible students are requested to register before the deadline.<br><br>
Best regards,<br>PhD Department Office`,
    description: "Sent to all users when a new qualifying exam is created by staff.",
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

    for (const template of defaultTemplates) {
    await db
      .insert(phdEmailTemplates)
      .values(template)
      .onConflictDoNothing({ target: phdEmailTemplates.name });
  }
};

const args = process.argv.slice(2);

console.log("Seeding data...");
await seedData(args.length ? args[0] : undefined);
