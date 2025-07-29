import { Request, Response, Router } from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = Router();

router.get(
  "/",
  checkAccess("patent:view"),
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await db.query.patents.findMany({
      columns: {
        id: true,
        applicationNumber: true,
        inventorsName: true,
        department: true,
        title: true,
        campus: true,
        filingDate: true,
        applicationPublicationDate: true,
        grantedDate: true,
        filingFY: true,
        filingAY: true,
        publishedAY: true,
        publishedFY: true,
        grantedFY: true,
        grantedAY: true,
        grantedCY: true,
        status: true,
        grantedPatentCertificateLink: true,
        applicationPublicationLink: true,
        form01Link: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(result);
  })
);

export default router; 