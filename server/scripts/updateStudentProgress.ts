import db from "@/config/db/index.ts";
import logger from "@/config/logger.ts";
import { users, phd } from "@/config/db/schema/admin.ts";
import { phdProposals, phdSemesters } from "@/config/db/schema/phd.ts";
import { phdRequests } from "@/config/db/schema/phdRequest.ts";
import { and, eq, desc, notInArray } from "drizzle-orm";
import xlsx from "xlsx";
import { z } from "zod";

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
    "pas/fail the qe(true or false)": z
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
    "Final Thesis": z.union([z.string(), z.number(), z.date()]).optional(),
});

type StudentProgress = z.infer<typeof studentProgressSchema>;

function excelDateToJSDate(serial: number) {
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
    logger.info(`Starting student progress update from file: ${filePath}`);

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet) as unknown[];

        let successCount = 0;
        let errorCount = 0;

        for (const row of data) {
            const parsedRow = studentProgressSchema.safeParse(row);

            if (!parsedRow.success) {
                logger.error(
                    `Skipping invalid row: ${JSON.stringify(row)}. Errors: ${
                        parsedRow.error.message
                    }`
                );
                errorCount++;
                continue;
            }

            const studentData = parsedRow.data;
            logger.info(`Processing student: ${studentData.email}`);

            try {
                await db.transaction(async (tx) => {
                    // 1. Upsert user in 'users' table
                    const userData = {
                        email: studentData.email,
                        name: studentData.name,
                        phone: studentData["phone number"]?.toString(),
                        type: "phd" as const,
                    };
                    await tx
                        .insert(users)
                        .values(userData)
                        .onConflictDoUpdate({
                            target: users.email,
                            set: {
                                name: userData.name,
                                phone: userData.phone,
                            },
                        });

                    // 2. Prepare and Upsert data in 'phd' table
                    const phdData = {
                        email: studentData.email,
                        name: studentData.name,
                        idNumber: studentData["bits id"]?.toString(),
                        department: studentData["department(eee/mech)"],
                        phdType:
                            studentData[
                                "phd type(full time/ part time)"
                            ]?.toLowerCase() === "full time"
                                ? "full-time"
                                : ("part-time" as "full-time" | "part-time"),
                        phone: studentData["phone number"]?.toString(),
                        erpId: studentData["erp id"]?.toString(),
                        personalEmail: studentData["personal email"],
                        notionalSupervisorEmail:
                            studentData["notional supervisor email"],
                        supervisorEmail: studentData["supervisor email"],
                    };

                    await tx
                        .insert(phd)
                        .values(phdData)
                        .onConflictDoUpdate({
                            target: phd.email,
                            set: {
                                name: phdData.name,
                                idNumber: phdData.idNumber,
                                department: phdData.department,
                                phdType: phdData.phdType,
                                phone: phdData.phone,
                                erpId: phdData.erpId,
                                personalEmail: phdData.personalEmail,
                                notionalSupervisorEmail:
                                    phdData.notionalSupervisorEmail,
                                supervisorEmail: phdData.supervisorEmail,
                            },
                        });

                    // 3. Update QE Status
                    const qeStatus =
                        studentData["pas/fail the qe(true or false)"];
                    if (
                        qeStatus &&
                        (String(qeStatus).toLowerCase() === "true" ||
                            qeStatus === true)
                    ) {
                        const qeDateValue =
                            studentData["qualification date if passed"];
                        if (!qeDateValue) {
                            throw new Error(
                                "qualification date if passed is required when QE status is true."
                            );
                        }

                        let qualificationDate: Date;
                        if (typeof qeDateValue === "number") {
                            qualificationDate = excelDateToJSDate(qeDateValue);
                        } else {
                            qualificationDate = new Date(qeDateValue);
                        }

                        if (isNaN(qualificationDate.getTime())) {
                            throw new Error(
                                `Invalid qualification date format: ${qeDateValue}`
                            );
                        }

                        await tx
                            .update(phd)
                            .set({
                                hasPassedQe: true,
                                qualificationDate: qualificationDate,
                            })
                            .where(eq(phd.email, studentData.email));
                        logger.info(
                            `Updated QE status to 'passed' for ${studentData.email}`
                        );
                    }

                    // 4. Update Proposal Status
                    if (
                        studentData["Proposal Seminar"]?.toLowerCase() ===
                        "completed"
                    ) {
                        const latestActiveProposal =
                            await tx.query.phdProposals.findFirst({
                                where: and(
                                    eq(
                                        phdProposals.studentEmail,
                                        studentData.email
                                    ),
                                    notInArray(phdProposals.status, [
                                        "completed",
                                        "deleted",
                                    ])
                                ),
                                orderBy: [desc(phdProposals.createdAt)],
                            });

                        if (latestActiveProposal) {
                            await tx
                                .update(phdProposals)
                                .set({ status: "completed" })
                                .where(
                                    eq(phdProposals.id, latestActiveProposal.id)
                                );
                            logger.info(
                                `Updated proposal status to 'completed' for ${studentData.email}`
                            );
                        } else {
                            logger.warn(
                                `No active proposal found for ${studentData.email} to mark as completed.`
                            );
                        }
                    }

                    // 5. Update PhD Requests
                    const requestMappings = {
                        "Presubmission Seminar": "pre_thesis_submission",
                        "Draft Notice": "draft_notice",
                        "Final Thesis": "final_thesis_submission",
                    } as const;

                    const latestSemester =
                        await tx.query.phdSemesters.findFirst({
                            orderBy: [
                                desc(phdSemesters.year),
                                desc(phdSemesters.semesterNumber),
                            ],
                        });

                    if (!latestSemester)
                        throw new Error(
                            "No active semester found in the database."
                        );

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
                                            eq(
                                                phdRequests.id,
                                                existingRequest.id
                                            )
                                        );
                                    logger.info(
                                        `Updated request '${requestType}' to 'completed' for ${studentData.email}`
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
                                logger.info(
                                    `Created completed request '${requestType}' for ${studentData.email}`
                                );
                            }
                        }
                    }
                });
                successCount++;
            } catch (e) {
                logger.error(
                    `Failed to process student ${studentData.email}: ${
                        (e as Error).message
                    }`
                );
                errorCount++;
            }
        }

        logger.info("------------------------------------");
        logger.info("Student progress update complete.");
        logger.info(`Successfully processed: ${successCount}`);
        logger.info(`Failed to process: ${errorCount}`);
        logger.info("------------------------------------");
    } catch (error) {
        logger.error("An error occurred during the script execution:", error);
    }
}

const args = process.argv.slice(2);
if (args.length !== 1) {
    logger.error(
        "Usage: tsx scripts/updateStudentProgress.ts <path_to_xlsx_file>"
    );
    process.exit(1);
}

const filePath = args[0];
updateStudentProgress(filePath)
    .catch((e) => {
        logger.error("Unhandled error in updateStudentProgress script:", e);
    })
    .finally(() => {
        process.exit(0);
    });
