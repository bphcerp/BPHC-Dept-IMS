import express from "express";
import db from "@/config/db/index.ts"; 
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res): Promise<void> => {
    const userEmail = req.user!.email;

    const documents = await db.query.signDocuments.findMany({
      where: (t, { eq }) => eq(t.createdBy, userEmail),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    res.status(200).json({
      count: documents.length,
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        docPath: doc.docPath,
        createdAt: doc.createdAt,
      })),
    });
  })
);

export default router;
