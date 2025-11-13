import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { phdProposals, phdProposalDacMembers } from "@/config/db/schema/phd.ts";
import { and, eq, desc, inArray } from "drizzle-orm";
import { phdProposalStatuses } from "../../lib/src/schemas/Phd.ts"; // Import the enum type

// Define all statuses that mean a proposal is "done" and DAC members are set
// Changed from "as const" to a typed mutable array
const DONE_PROPOSAL_STATUSES: (typeof phdProposalStatuses)[number][] = [
    "completed",
    "finalising_documents",
    "seminar_pending",
    "dac_accepted",
    "dac_review",
];

async function backfillDacMembers() {
    console.log("Starting DAC member backfill script...");

    // 1. Get all students.
    const allStudents = await db.select({ email: phd.email }).from(phd);
    let updatedCount = 0;
    let skippedNoProposal = 0;
    let skippedNoDac = 0;

    console.log(`Found ${allStudents.length} total PhD students to check.`);

    for (const student of allStudents) {
        // 2. For each student, find their *latest* proposal that is in a "done" state.
        const latestCompletedProposal = await db.query.phdProposals.findFirst({
            where: and(
                eq(phdProposals.studentEmail, student.email),
                // This will now work as the array is mutable
                inArray(phdProposals.status, DONE_PROPOSAL_STATUSES)
            ),
            orderBy: [desc(phdProposals.createdAt)],
            columns: { id: true, status: true },
        });

        if (!latestCompletedProposal) {
            // This student has no proposal in any of the "done" states
            skippedNoProposal++;
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
            // The proposal was found, but it has no linked DAC members
            console.warn(
                `Skipping ${student.email}: Proposal ${latestCompletedProposal.id} (Status: ${latestCompletedProposal.status}) has no DAC members.`
            );
            skippedNoDac++;
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
        console.log(
            `Updated DAC members for ${student.email} from proposal ${latestCompletedProposal.id}.`
        );
    }

    console.log("------------------------------------");
    console.log("DAC Member Backfill Complete.");
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped (no "done" proposal found): ${skippedNoProposal}`);
    console.log(
        `Skipped (proposal found, but no DAC members linked): ${skippedNoDac}`
    );
    console.log("------------------------------------");
}

backfillDacMembers()
    .catch((e) => {
        console.error("Error in backfillDacMembers script:", e);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
