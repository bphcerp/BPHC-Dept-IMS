import { Router } from "express";
import { excelUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import XLSX from "xlsx";
import db from "@/config/db/index.ts";
import { patents, patentInventors } from "@/config/db/schema/patents.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";

const router = Router();

interface PatentRow {
  applicationNumber: string;
  inventorsName: string;
  inventorsEmail?: string;
  inventors?: string;
  department: string;
  title: string;
  campus: string;
  filingDate: string;
  applicationPublicationDate?: string;
  grantedDate?: string;
  filingFY: string;
  filingAY: string;
  publishedAY?: string;
  publishedFY?: string;
  grantedFY?: string;
  grantedAY?: string;
  grantedCY?: string;
  status: "Pending" | "Filed" | "Granted" | "Abandoned" | "Rejected";
  grantedPatentCertificateLink?: string;
  applicationPublicationLink?: string;
  form01Link?: string;
}

const validatePatentRow = (row: any): PatentRow | null => {
  if (!row || Object.keys(row).length === 0) {
    return null;
  }

  if (!row.applicationNumber || !row.inventorsName || !row.department ||
    !row.title || !row.campus || !row.filingDate || !row.filingFY ||
    !row.filingAY || !row.status) {
    return null;
  }

  if (!["Pending", "Filed", "Granted", "Abandoned", "Rejected"].includes(row.status)) {
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
    const parts = stringDate.split('/');
    if (parts.length === 3) {
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

  // Convert inventorsName and inventorsEmail to inventors JSON format
  const inventorsName = row.inventorsName.toString().trim();
  const inventorsEmail = row.inventorsEmail ? row.inventorsEmail.toString().trim() : "";

  const nameArray = inventorsName.split(',').map((name: string) => name.trim());
  const emailArray = inventorsEmail ? inventorsEmail.split(',').map((email: string) => email.trim()) : [];

  const inventorsArray = nameArray.map((name: string, index: number) => ({
    name: name,
    email: emailArray[index] || ""
  }));


  return {
    applicationNumber: row.applicationNumber.toString().trim(),
    inventorsName: inventorsName,
    inventors: JSON.stringify(inventorsArray),
    department: row.department.toString().trim(),
    title: row.title.toString().trim(),
    campus: row.campus.toString().trim(),
    filingDate: convertDateFormat(row.filingDate.toString().trim()),
    applicationPublicationDate: row.applicationPublicationDate ? convertDateFormat(row.applicationPublicationDate.toString().trim()) : undefined,
    grantedDate: row.grantedDate ? convertDateFormat(row.grantedDate.toString().trim()) : undefined,
    filingFY: row.filingFY.toString().trim(),
    filingAY: row.filingAY.toString().trim(),
    publishedAY: row.publishedAY?.toString().trim(),
    publishedFY: row.publishedFY?.toString().trim(),
    grantedFY: row.grantedFY?.toString().trim(),
    grantedAY: row.grantedAY?.toString().trim(),
    grantedCY: row.grantedCY?.toString().trim(),
    status: row.status as "Pending" | "Filed" | "Granted" | "Abandoned" | "Rejected",
    grantedPatentCertificateLink: row.grantedPatentCertificateLink?.toString().trim(),
    applicationPublicationLink: row.applicationPublicationLink?.toString().trim(),
    form01Link: row.form01Link?.toString().trim(),
  };
};

router.post(
  "/",
  checkAccess("patent:bulk-upload"),
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
      const validatedRow = validatePatentRow(row);
      if (!validatedRow) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: Invalid or missing required data`);
        continue;
      }
      try {
        // Check for duplicate patent
        const duplicate = await db
          .select()
          .from(patents)
          .where(eq(patents.applicationNumber, validatedRow.applicationNumber));

        if (duplicate.length > 0) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Duplicate patent (application number already exists)`);
          continue;
        }

        const patentId = crypto.randomUUID();

        await db
          .insert(patents)
          .values({
            id: patentId,
            applicationNumber: validatedRow.applicationNumber,
            inventorsName: validatedRow.inventorsName,
            inventors: validatedRow.inventors,
            department: validatedRow.department,
            title: validatedRow.title,
            campus: validatedRow.campus,
            filingDate: validatedRow.filingDate,
            applicationPublicationDate: validatedRow.applicationPublicationDate,
            grantedDate: validatedRow.grantedDate,
            filingFY: validatedRow.filingFY,
            filingAY: validatedRow.filingAY,
            publishedAY: validatedRow.publishedAY,
            publishedFY: validatedRow.publishedFY,
            grantedFY: validatedRow.grantedFY,
            grantedAY: validatedRow.grantedAY,
            grantedCY: validatedRow.grantedCY,
            status: validatedRow.status,
            grantedPatentCertificateLink: validatedRow.grantedPatentCertificateLink,
            applicationPublicationLink: validatedRow.applicationPublicationLink,
            form01Link: validatedRow.form01Link,
          });

        // Insert inventors into patentInventors table if inventors data is provided
        if (validatedRow.inventors) {
          try {
            const inventorsArray = JSON.parse(validatedRow.inventors);

            if (Array.isArray(inventorsArray) && inventorsArray.length > 0) {
              const inventorRecords = inventorsArray.map(inventor => ({
                patentId: patentId,
                name: inventor.name || '',
                email: inventor.email || null,
                department: validatedRow.department,
                campus: validatedRow.campus,
                affiliation: null,
              }));

              await db.insert(patentInventors).values(inventorRecords);
            }
          } catch (parseError) {
            console.error(`Error parsing inventors JSON for patent ${validatedRow.applicationNumber}:`, parseError);
          }
        }

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