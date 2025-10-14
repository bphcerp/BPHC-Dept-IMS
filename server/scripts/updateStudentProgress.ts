import db from "@/config/db/index.ts";
import { users, phd, faculty } from "@/config/db/schema/admin.ts";
import { phdProposals, phdSemesters } from "@/config/db/schema/phd.ts";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { files } from "@/config/db/schema/form.ts";
import { and, eq, desc } from "drizzle-orm";
import xlsx from "xlsx";
import { z } from "zod";
import { modules } from "lib";

const studentProgressSchema = z.object({
    name: z.string().optional(),
    email: z.string().email(),
    "bits id": z.union([z.string(), z.number()]).optional(),
    "department(eee/mech)": z.string().optional(),
    "phd type(full time/ part time)": z.string().optional(),
    "phone number": z.union([z.string(), z.number()]).optional(),
    "erp id": z.union([z.string(), z.number()]).optional(),
    "personal email": z.string().email().optional().nullable(),
    "notional supervisor email": z.string().email().optional().nullable(),
    "supervisor email": z.string().email().optional().nullable(),
    "Supervisor Name": z.string().optional().nullable(),
    "pas/fail the qe(true  or false)": z
        .union([z.string(), z.boolean()])
        .optional(),
    "qualification date if passed": z
        .union([z.string(), z.number(), z.date()])
        .optional(),
    "Proposal Seminar": z.string().optional(),
    "Presubmission Seminar": z
        .union([z.string(), z.number(), z.date()])
        .optional(),
    "Draft Notice": z.union([z.string(), z.number(), z.date()]).optional(),
    "Pre-thesis Submission": z
        .union([z.string(), z.number(), z.date()])
        .optional(),
    "Final Thesis": z.union([z.string(), z.number(), z.date()]).optional(),
});

type StudentProgress = z.infer<typeof studentProgressSchema>;

function excelDateToJSDate(serial: number) {
    if (serial < 1) return undefined;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    total_seconds -= seconds;
    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;
    return new Date(
        date_info.getFullYear(),
        date_info.getMonth(),
        date_info.getDate(),
        hours,
        minutes,
        seconds
    );
}

async function updateStudentProgress(filePath: string) {
    console.log(`Starting student progress update from file: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("No sheets found in the Excel file.");
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet) as unknown[];

    let successCount = 0;
    let errorCount = 0;

    for (const row of data) {
        const parsedRow = studentProgressSchema.safeParse(row);

        if (!parsedRow.success) {
            console.log(
                `Skipping invalid row: ${JSON.stringify(row)}. Errors: ${
                    parsedRow.error.message
                }`
            );
            errorCount++;
            continue;
        }

        const studentData = parsedRow.data;
        console.log(`Processing student: ${studentData.email}`);
        // console.log("Parsed Excel Data for student:", studentData);

        await db
            .transaction(async (tx) => {
                let currentStatus = "Awaiting QE Application";
                const qeStatus = studentData["pas/fail the qe(true  or false)"];
                if (
                    (qeStatus &&
                        (String(qeStatus).toLowerCase() === "true" ||
                            qeStatus === true)) ||
                    studentData["qualification date if passed"]
                ) {
                    currentStatus = "QE Passed, Awaiting Proposal";
                    if (
                        studentData["Proposal Seminar"]?.toLowerCase() ===
                        "completed"
                    ) {
                        currentStatus =
                            "Proposal Completed, Awaiting Pre-Submission Request";
                        if (studentData["Presubmission Seminar"]) {
                            currentStatus =
                                "Pre-Submission Completed, Awaiting Draft Notice Request";
                            if (studentData["Draft Notice"]) {
                                currentStatus =
                                    "Draft Notice Completed, Awaiting Pre-Thesis Submission";
                                if (studentData["Pre-thesis Submission"]) {
                                    currentStatus =
                                        "Pre-Thesis Submission Completed, Awaiting Final Thesis Submission";
                                    if (studentData["Final Thesis"]) {
                                        currentStatus = "PhD Journey Completed";
                                    }
                                }
                            }
                        }
                    }
                }

                const supervisorEmails = new Set<string>();
                if (studentData["supervisor email"])
                    supervisorEmails.add(studentData["supervisor email"]);
                if (studentData["notional supervisor email"])
                    supervisorEmails.add(
                        studentData["notional supervisor email"]
                    );

                if (
                    supervisorEmails.size === 0 &&
                    currentStatus !== "Awaiting QE Application"
                ) {
                    console.log(
                        `Student ${studentData.email} has progress but is missing a 'supervisor email' in the Excel sheet. They will not be linked to a supervisor.`
                    );
                }

                for (const email of supervisorEmails) {
                    const existingSupervisor = await tx.query.users.findFirst({
                        where: eq(users.email, email),
                    });
                    if (!existingSupervisor) {
                        await tx.insert(users).values({
                            email,
                            name: studentData["Supervisor Name"],
                            type: "faculty",
                        });
                        await tx.insert(faculty).values({
                            email,
                            name: studentData["Supervisor Name"],
                        });
                        console.log(
                            `Created new faculty user for supervisor: ${email}`
                        );
                    }
                }

                await tx
                    .insert(users)
                    .values({
                        email: studentData.email,
                        name: studentData.name,
                        phone: studentData["phone number"]?.toString(),
                        type: "phd",
                    })
                    .onConflictDoUpdate({
                        target: users.email,
                        set: {
                            name: studentData.name,
                            phone: studentData["phone number"]?.toString(),
                        },
                    });

                const phdDataSet = {
                    name: studentData.name,
                    idNumber: studentData["bits id"]?.toString(),
                    department: studentData["department(eee/mech)"],
                    phdType:
                        studentData[
                            "phd type(full time/ part time)"
                        ]?.toLowerCase() === "full time"
                            ? ("full-time" as const)
                            : ("part-time" as const),
                    phone: studentData["phone number"]?.toString(),
                    erpId: studentData["erp id"]?.toString(),
                    personalEmail: studentData["personal email"],
                    notionalSupervisorEmail:
                        studentData["notional supervisor email"],
                    supervisorEmail: studentData["supervisor email"],
                    currentStatus: currentStatus,
                };
                await tx
                    .insert(phd)
                    .values({ email: studentData.email, ...phdDataSet })
                    .onConflictDoUpdate({ target: phd.email, set: phdDataSet });
                console.log(
                    `Upserted data for ${studentData.email} with status: ${currentStatus}`
                );

                if (
                    qeStatus &&
                    (String(qeStatus).toLowerCase() === "true" ||
                        qeStatus === true)
                ) {
                    const qeDateValue =
                        studentData["qualification date if passed"];
                    if (qeDateValue) {
                        let qualificationDate: Date | undefined;
                        if (typeof qeDateValue === "number")
                            qualificationDate = excelDateToJSDate(qeDateValue);
                        else qualificationDate = new Date(qeDateValue);
                        if (
                            qualificationDate &&
                            !isNaN(qualificationDate.getTime())
                        ) {
                            await tx
                                .update(phd)
                                .set({
                                    hasPassedQe: true,
                                    qualificationDate: qualificationDate,
                                })
                                .where(eq(phd.email, studentData.email));
                        }
                    }
                }

                const latestSemester = await tx.query.phdSemesters.findFirst({
                    orderBy: [
                        desc(phdSemesters.year),
                        desc(phdSemesters.semesterNumber),
                    ],
                });
                if (!latestSemester)
                    throw new Error("No active semester found.");

                if (
                    studentData["Proposal Seminar"]?.toLowerCase() ===
                    "completed"
                ) {
                    const existingProposal =
                        await tx.query.phdProposals.findFirst({
                            where: eq(
                                phdProposals.studentEmail,
                                studentData.email
                            ),
                        });
                    if (existingProposal) {
                        if (existingProposal.status !== "completed") {
                            await tx
                                .update(phdProposals)
                                .set({ status: "completed" })
                                .where(
                                    eq(phdProposals.id, existingProposal.id)
                                );
                        }
                    } else {
                        if (studentData["supervisor email"]) {
                            // Create a single dummy file record to satisfy foreign key constraints
                            const [dummyFile] = await tx
                                .insert(files)
                                .values({
                                    userEmail: studentData.email,
                                    filePath:
                                        "/dummy/path/for/imported/proposal.pdf",
                                    originalName: "imported_proposal.pdf",
                                    mimetype: "application/pdf",
                                    size: 0,
                                    module: modules[3],
                                })
                                .returning();

                            await tx.insert(phdProposals).values({
                                studentEmail: studentData.email,
                                supervisorEmail:
                                    studentData["supervisor email"],
                                title: "Completed via Excel Import",
                                status: "completed",
                                proposalSemesterId: latestSemester.id,
                                appendixFileId: dummyFile.id,
                                summaryFileId: dummyFile.id,
                                outlineFileId: dummyFile.id,
                            });
                        } else {
                            console.log(
                                `Cannot create completed proposal for ${studentData.email} due to missing supervisor email.`
                            );
                        }
                    }
                }

                const requestMappings = {
                    "Presubmission Seminar": "pre_submission",
                    "Draft Notice": "draft_notice",
                    "Final Thesis": "final_thesis_submission",
                } as const;

                for (const [columnName, requestType] of Object.entries(
                    requestMappings
                )) {
                    if (studentData[columnName as keyof StudentProgress]) {
                        const existingRequest =
                            await tx.query.phdRequests.findFirst({
                                where: and(
                                    eq(
                                        phdRequests.studentEmail,
                                        studentData.email
                                    ),
                                    eq(phdRequests.requestType, requestType)
                                ),
                            });
                        if (existingRequest) {
                            if (existingRequest.status !== "completed") {
                                await tx
                                    .update(phdRequests)
                                    .set({ status: "completed" })
                                    .where(
                                        eq(phdRequests.id, existingRequest.id)
                                    );
                            }
                        } else {
                            const supervisorEmail =
                                studentData["supervisor email"];
                            if (!supervisorEmail) {
                                throw new Error(
                                    `'supervisor email' column is required to create new request '${requestType}' for ${studentData.email}`
                                );
                            }
                            await tx.insert(phdRequests).values({
                                studentEmail: studentData.email,
                                supervisorEmail: supervisorEmail,
                                semesterId: latestSemester.id,
                                requestType: requestType,
                                status: "completed",
                            });
                        }
                    }
                }
            })
            .then(() => {
                successCount++;
            })
            .catch((e) => {
                console.log(
                    `Failed to process student ${studentData.email}: ${(e as Error).message}`
                );
                errorCount++;
            });
    }

    console.log("------------------------------------");
    console.log("Student progress update complete.");
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Failed to process: ${errorCount}`);
    console.log("------------------------------------");
}

const args = process.argv.slice(2);
if (args.length !== 1) {
    console.log(
        "Usage: tsx scripts/updateStudentProgress.ts <path_to_xlsx_file>"
    );
    process.exit(1);
}

const filePath = args[0];
updateStudentProgress(filePath)
    .catch((e) => {
        console.log("Unhandled error in updateStudentProgress script:", e);
    })
    .finally(() => {
        process.exit(0);
    });
