import db from "@/config/db/index.ts";
import { phdProposals } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { createTodos } from "@/lib/todos/index.ts";
import { modules } from "lib";
import logger from "@/config/logger.ts";
async function checkDacDeadlines() {
    logger.info("Running job: checkDacDeadlines");
    const now = new Date();
    const overdueProposals = await db.query.phdProposals.findMany({
        where: eq(phdProposals.status, "dac_review"),
        with: { student: true, proposalSemester: true },
    });
    const proposalsToFlag = overdueProposals.filter(
        (p) => p.proposalSemester.dacReviewDate < now
    );
    if (proposalsToFlag.length === 0) {
        logger.info("No overdue DAC reviews found.");
        return;
    }
    const drcConveners = await getUsersWithPermission("phd:drc:proposal");
    if (drcConveners.length === 0) {
        logger.warn("No DRC conveners found to assign reminder To-Dos.");
        return;
    }
    const todosToCreate = [];
    for (const proposal of proposalsToFlag) {
        for (const drc of drcConveners) {
            todosToCreate.push({
                assignedTo: drc.email,
                createdBy: "system",
                title: `DAC Review Overdue for ${proposal.student.name}`,
                description: `The DAC review deadline for ${proposal.student.name}(${proposal.student.email}) has passed. Please follow up with the DAC members and then request seminar details from the supervisor.`,
                module: modules[3],
                completionEvent: `proposal:dac-deadline-passed:${proposal.id}`,
                link: `/phd/drc-convenor/proposal-management/${proposal.id}`,
            });
        }
    }
    if (todosToCreate.length > 0) {
        await createTodos(todosToCreate);
        logger.info(
            `Created ${todosToCreate.length} To-Dos for overdue DAC reviews.`
        );
    } else {
        logger.info("No new To-Dos needed for overdue DAC reviews.");
    }
}
checkDacDeadlines()
    .catch((e) => {
        logger.error("Error in checkDacDeadlines job:", e);
    })
    .finally(() => {
        process.exit(0);
    });
