// server/src/scripts/autoSubmitDrafts.ts
import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { eq, inArray } from "drizzle-orm";
import logger from "@/config/logger.ts";

async function autoSubmitDrafts() {
    logger.info("Running job: autoSubmitDrafts");
    const now = new Date();

    const draftProposals = await db.query.phdProposals.findMany({
        where: eq(phdProposals.status, "draft"),
        with: {
            proposalSemester: true,
        },
    });

    const proposalsToSubmit = draftProposals.filter(
        (p) => p.proposalSemester.studentSubmissionDate < now
    );

    if (proposalsToSubmit.length === 0) {
        logger.info("No overdue proposal drafts found.");
        return;
    }

    const proposalIdsToUpdate = proposalsToSubmit.map((p) => p.id);

    await db
        .update(phdProposals)
        .set({ status: "supervisor_review" })
        .where(inArray(phdProposals.id, proposalIdsToUpdate));

    logger.info(
        `Auto-submitted ${proposalsToSubmit.length} drafts to 'supervisor_review'.`
    );
}

autoSubmitDrafts()
    .catch((e) => {
        logger.error("Error in autoSubmitDrafts job:", e);
    })
    .finally(() => {
        process.exit(0);
    });
