import { Router } from "express";
import { excelUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import XLSX from "xlsx";
import db from "@/config/db/index.ts";
import {
  projects,
  investigators,
  fundingAgencies,
  projectCoPIs,
  projectPIs,
} from "@/config/db/schema/project.ts";
import { eq, and } from "drizzle-orm";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = Router();

interface ProjectRow {
  title: string;
  piName: string;
  piEmail: string;
  piDepartment?: string;
  piCampus?: string;
  piAffiliation?: string;
  coPIs?: string; // Comma-separated emails
  PIs?: string; // Comma-separated emails
  fundingAgency: string;
  fundingAgencyNature: "public_sector" | "private_industry";
  sanctionedAmount: number;
  capexAmount?: number;
  opexAmount?: number;
  manpowerAmount?: number;
  approvalDate: string;
  startDate: string;
  endDate: string;
  hasExtension?: boolean;
}

const validateProjectRow = (row: any): ProjectRow | null => {
  if (!row || Object.keys(row).length === 0) {
    return null;
  }

  if (!row.title || !row.piName || !row.piEmail || !row.fundingAgency || 
      !row.sanctionedAmount || !row.approvalDate || !row.startDate || !row.endDate) {
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(row.piEmail)) {
    return null;
  }

  if (row.fundingAgencyNature && !["public_sector", "private_industry"].includes(row.fundingAgencyNature)) {
    return null;
  }

  if (isNaN(Number(row.sanctionedAmount))) {
    return null;
  }

  const convertDateFormat = (dateStr: string | number): string => {

    if (typeof dateStr === 'number') {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000);

      if (isNaN(date.getTime())) {
        return String(dateStr);
      }
      
      const converted = date.toISOString().split('T')[0];
      return converted;
    }

    const stringDate = String(dateStr);
    const parts = stringDate.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return stringDate;
      }
      if (parts[0].length === 2) {
        const converted = `${parts[2]}-${parts[1]}-${parts[0]}`;

        const date = new Date(converted);
        if (isNaN(date.getTime())) {
          return stringDate;
        }

        return converted;
      }
    }
    return stringDate;
  };

  const parseBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      return lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  };

  return {
    title: row.title.toString().trim(),
    piName: row.piName.toString().trim(),
    piEmail: row.piEmail.toString().trim().toLowerCase(),
    piDepartment: row.piDepartment?.toString().trim(),
    piCampus: row.piCampus?.toString().trim(),
    piAffiliation: row.piAffiliation?.toString().trim(),
    coPIs: row.coPIs?.toString().trim(),
    PIs: row.otherPIs?.toString().trim(),
    fundingAgency: row.fundingAgency.toString().trim(),
    fundingAgencyNature: row.fundingAgencyNature || "public_sector",
    sanctionedAmount: Number(row.sanctionedAmount),
    capexAmount: row.capexAmount !== undefined && row.capexAmount !== null && row.capexAmount !== '' ? Number(row.capexAmount) : undefined,
    opexAmount: row.opexAmount !== undefined && row.opexAmount !== null && row.opexAmount !== '' ? Number(row.opexAmount) : undefined,
    manpowerAmount: row.manpowerAmount !== undefined && row.manpowerAmount !== null && row.manpowerAmount !== '' ? Number(row.manpowerAmount) : undefined,
    approvalDate: convertDateFormat(row.approvalDate.toString().trim()),
    startDate: convertDateFormat(row.startDate.toString().trim()),
    endDate: convertDateFormat(row.endDate.toString().trim()),
    hasExtension: parseBoolean(row.hasExtension),
  };
};

router.post(
  "/",
  checkAccess("project:create"),
  excelUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'dd-mm-yyyy'
    });

    if (data.length === 0) {
      res.status(400).json({ error: "No data found in the file" });
      return;
    }

    const results = {
      total: data.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const validatedRow = validateProjectRow(row);
      if (!validatedRow) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: Invalid or missing required data`);
        continue;
      }
      try {
        let [pi] = await db
          .select()
          .from(investigators)
          .where(eq(investigators.email, validatedRow.piEmail));
        if (!pi) {
          [pi] = await db
            .insert(investigators)
            .values({
              name: validatedRow.piName,
              email: validatedRow.piEmail,
              department: validatedRow.piDepartment || null,
              campus: validatedRow.piCampus || null,
              affiliation: validatedRow.piAffiliation || null,
            })
            .returning();
        }
        let [fundingAgency] = await db
          .select()
          .from(fundingAgencies)
          .where(eq(fundingAgencies.name, validatedRow.fundingAgency));
        if (!fundingAgency) {
          [fundingAgency] = await db
            .insert(fundingAgencies)
            .values({
              name: validatedRow.fundingAgency,
            })
            .returning();
        }
        const duplicate = await db.select().from(projects).where(and(
          eq(projects.title, validatedRow.title),
          eq(projects.piId, pi.id),
          eq(projects.fundingAgencyId, fundingAgency.id),
          eq(projects.sanctionedAmount, validatedRow.sanctionedAmount.toString()),
          eq(projects.approvalDate, validatedRow.approvalDate),
          eq(projects.startDate, validatedRow.startDate),
          eq(projects.endDate, validatedRow.endDate)
        ));
        if (duplicate.length > 0) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Duplicate project (already exists)`);
          continue;
        }
        const [project] = await db
          .insert(projects)
          .values({
            title: validatedRow.title,
            piId: pi.id,
            fundingAgencyId: fundingAgency.id,
            fundingAgencyNature: validatedRow.fundingAgencyNature,
            sanctionedAmount: validatedRow.sanctionedAmount.toString(),
            capexAmount: validatedRow.capexAmount !== undefined ? validatedRow.capexAmount.toString() : "0",
            opexAmount: validatedRow.opexAmount !== undefined ? validatedRow.opexAmount.toString() : "0",
            manpowerAmount: validatedRow.manpowerAmount !== undefined ? validatedRow.manpowerAmount.toString() : "0",
            approvalDate: validatedRow.approvalDate,
            startDate: validatedRow.startDate,
            endDate: validatedRow.endDate,
            hasExtension: validatedRow.hasExtension || false,
          })
          .returning();
        if (validatedRow.coPIs) {
          const coPIsEmails = String(validatedRow.coPIs).split(',').map(e => e.trim()).filter(Boolean);
          const coPINames = String(row['coPINames'] || '').split(',').map(n => n.trim());
          const coPIs = coPIsEmails.map((email, idx) => {
            let name = coPINames[idx] || undefined;
            if (name && typeof name === 'string' && email && name.trim().toLowerCase() === email.split('@')[0].toLowerCase()) {
              name = undefined;
            }
            return {
              email,
              name,
            };
          });
          for (const { email, name } of coPIs) {
            if (email && email !== validatedRow.piEmail) {
              let [coPI] = await db
                .select()
                .from(investigators)
                .where(eq(investigators.email, email));
              if (!coPI) {
                [coPI] = await db
                  .insert(investigators)
                  .values({
                    name: name || email.split("@")[0],
                    email: email,
                  })
                  .returning();
              }
              await db
                .insert(projectCoPIs)
                .values({
                  projectId: project.id,
                  investigatorId: coPI.id,
                });
            }
          }
        }
        if (validatedRow.PIs) {
          const PIsEmails = String(validatedRow.PIs).split(',').map(e => e.trim()).filter(Boolean);
          const PINames = String(row['otherPINames'] || '').split(',').map(n => n.trim());
          let PIs = PIsEmails.map((email, idx) => {
            let name = PINames[idx] || undefined;
            if (name && typeof name === 'string' && email && name.trim().toLowerCase() === email.split('@')[0].toLowerCase()) {
              name = undefined;
            }
            return {
              email,
              name,
            };
          });
          for (const { email, name } of PIs) {
            if (email) {
              let [PI] = await db
                .select()
                .from(investigators)
                .where(eq(investigators.email, email));
              if (!PI) {
                [PI] = await db
                  .insert(investigators)
                  .values({
                    name: name || email.split("@")[0],
                    email: email,
                  })
                  .returning();
              }
              await db
                .insert(projectPIs)
                .values({
                  projectId: project.id,
                  investigatorId: PI.id,
                });
            }
          }
        }
        let [mainPI] = await db
          .select()
          .from(investigators)
          .where(eq(investigators.email, validatedRow.piEmail));
        if (!mainPI) {
          [mainPI] = await db
            .insert(investigators)
            .values({
              name: validatedRow.piName || validatedRow.piEmail.split("@")[0],
              email: validatedRow.piEmail,
            })
            .returning();
        }
        await db
          .insert(projectPIs)
          .values({
            projectId: project.id,
            investigatorId: mainPI.id,
          });
          
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    res.json({
      message: "Bulk upload completed",
      results
    });
  })
);

export default router; 