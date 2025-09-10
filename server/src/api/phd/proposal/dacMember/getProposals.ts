import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import { phdProposalDacMembers } from "@/config/db/schema/phd.ts";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res) => {
    const dacMemberEmail = req.user!.email;

    // Fetch the links between proposals and the current DAC member
    const assignedProposalLinks = await db.query.phdProposalDacMembers.findMany({
      where: eq(phdProposalDacMembers.dacMemberEmail, dacMemberEmail),
      with: {
        proposal: {
          with: {
            student: {
              columns: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Filter for proposals that are in the 'dac_review' stage and format the response
    const assignedProposals = assignedProposalLinks
      .filter((link) => link.proposal.status === "dac_review")
      .map((link) => ({
        id: link.proposal.id,
        title: link.proposal.title,
        status: link.proposal.status,
        updatedAt: link.proposal.updatedAt,
        student: {
          name: link.proposal.student.name,
          email: link.proposal.student.email,
        },
      }));

    res.status(200).json(assignedProposals);
  })
);

export default router;