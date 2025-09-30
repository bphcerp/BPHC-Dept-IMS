import { Request, Response, Router } from "express";
import db from "@/config/db/index.ts";
import { patents, patentInventors } from "@/config/db/schema/patents.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";

const router = Router();

router.get(
  "/",
  checkAccess("patent:view"),
  asyncHandler(async (req: Request, res: Response) => {
    const userEmail = req.user?.email;

    if (!userEmail) {
      res.status(401).json({ error: "User email not found in token" });
      return;
    }

    const result = await db
      .select({
        id: patents.id,
        applicationNumber: patents.applicationNumber,
        inventorsName: patents.inventorsName,
        department: patents.department,
        title: patents.title,
        campus: patents.campus,
        filingDate: patents.filingDate,
        applicationPublicationDate: patents.applicationPublicationDate,
        grantedDate: patents.grantedDate,
        filingFY: patents.filingFY,
        filingAY: patents.filingAY,
        publishedAY: patents.publishedAY,
        publishedFY: patents.publishedFY,
        grantedFY: patents.grantedFY,
        grantedAY: patents.grantedAY,
        grantedCY: patents.grantedCY,
        status: patents.status,
        grantedPatentCertificateLink: patents.grantedPatentCertificateLink,
        applicationPublicationLink: patents.applicationPublicationLink,
        form01Link: patents.form01Link,
        createdAt: patents.createdAt,
        updatedAt: patents.updatedAt,
      })
      .from(patents)
      .innerJoin(patentInventors, eq(patents.id, patentInventors.patentId))
      .where(eq(patentInventors.email, userEmail));

    res.json(result);
  })
);

export default router; 