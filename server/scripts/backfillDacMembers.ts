import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdProposals, phdProposalDacMembers } from "@/config/db/schema/phd.ts";
import { and, eq, desc } from "drizzle-orm";
import logger from "@/config/logger.ts";

async function backfillDacMembers() {
    logger.info("Starting DAC member backfill script...");

    // 1. Get all students.
    const allStudents = await db.select({ email: phd.email }).from(phd);
    let updatedCount = 0;
    let skippedCount = 0;

    logger.info(`Found ${allStudents.length} total PhD students to check.`);

    for (const student of allStudents) {
        // 2. For each student, find their *latest* completed proposal.
        const latestCompletedProposal = await db.query.phdProposals.findFirst({
            where: and(
                eq(phdProposals.studentEmail, student.email),
                eq(phdProposals.status, "completed")
            ),
            orderBy: [desc(phdProposals.createdAt)],
            columns: { id: true },
        });

        if (!latestCompletedProposal) {
            skippedCount++;
            continue;
        }

        // 3. Find the DAC members for that proposal.
        const dacMembers = await db.query.phdProposalDacMembers.findMany({
            where: eq(
                phdProposalDacMembers.proposalId,
                latestCompletedProposal.id
            ),
            with: {
                dacMember: {
                    columns: { name: true },
                },
            },
            limit: 2, // We only care about the first two
        });

        if (dacMembers.length === 0) {
            skippedCount++;
            continue;
        }

        // 4. Prepare the update data
        const dac1 = dacMembers[0];
        const dac2 = dacMembers[1]; // Will be undefined if it doesn't exist

        const updateData = {
            dacMember1Email: dac1.dacMemberEmail,
            dacMember1Name: dac1.dacMemberName ?? dac1.dacMember?.name ?? null,
            dacMember2Email: dac2?.dacMemberEmail ?? null,
            dacMember2Name: dac2
                ? (dac2.dacMemberName ?? dac2.dacMember?.name ?? null)
                : null,
        };

        // 5. Update the phd table
        await db
            .update(phd)
            .set(updateData)
            .where(eq(phd.email, student.email));

        updatedCount++;
        logger.info(`Updated DAC members for ${student.email}.`);
    }

    logger.info("------------------------------------");
    logger.info("DAC Member Backfill Complete.");
    logger.info(`Successfully updated: ${updatedCount}`);
    logger.info(`Skipped (no completed proposal/DAC): ${skippedCount}`);
    logger.info("------------------------------------");
}

backfillDacMembers()
    .catch((e) => {
        logger.error("Error in backfillDacMembers script:", e);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
