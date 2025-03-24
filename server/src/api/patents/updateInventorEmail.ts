import { db } from '@/config/db/index.ts'; // Import your Drizzle database instance
import { excelPatents } from '@/config/db/schema/patents.ts'; // Import your schema
import express from 'express';

const app = express();
app.use(express.json());

app.patch("/updatePatentInventorEmail", async (req, res) => {
  try {
    const { application_number, inventorIndex, newEmail } = req.body;

    // Validate inputs
    if (!application_number && application_number !== 0) {
      return res.status(400).json({ error: "application_number is required" });
    }
    if (inventorIndex === undefined) {
      return res.status(400).json({ error: "inventorIndex is required" });
    }
    if (newEmail === undefined) {
      return res.status(400).json({ error: "newEmail is required" });
    }

    // 1. Fetch the patent row using Drizzle
    const patentRow = await db.query.excelPatents.findFirst({
      where: (patents, { eq }) => eq(patents.application_number, application_number),
    });

    if (!patentRow) {
      return res.status(404).json({ error: "Patent row not found" });
    }

    // 2. Parse inventors_with_email (fallback to inventors_name if necessary)
    let inventorsStr = patentRow.inventors_with_email || patentRow.inventors_name || "";

    // Helper function to parse "Name (email), Another Name (email)" -> array of { name, email }
    const parseInventorsString = (str) => {
      if (!str.trim()) return [];
      return str.split(",").map((entry) => {
        const match = entry.trim().match(/(.*)\((.*)\)/);
        return match ? { name: match[1].trim(), email: match[2].trim() } : { name: entry.trim(), email: "" };
      });
    };

    // 3. Convert string to array
    let inventorsArray = parseInventorsString(inventorsStr);

    // 4. Update the specific inventor's email
    if (inventorsArray[inventorIndex]) {
      inventorsArray[inventorIndex].email = newEmail;
    } else {
      return res.status(400).json({ error: "Invalid inventorIndex" });
    }

    // 5. Convert the updated array back to a string
    const updatedInventorsStr = inventorsArray
      .map((inv) => `${inv.name} (${inv.email || "No Email"})`)
      .join(", ");

    // 6. Save the updated string in the DB
    await db.update(excelPatents)
      .set({ inventors_with_email: updatedInventorsStr })
      .where((patents, { eq }) => eq(patents.application_number, application_number));

    return res.json({ success: true, updated_inventors_with_email: updatedInventorsStr });
  } catch (err) {
    console.error("Server Error in updatePatentInventorEmail:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
