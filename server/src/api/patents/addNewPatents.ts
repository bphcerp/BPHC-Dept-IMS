import { db } from '@/config/db/index.ts'; // Import your Drizzle database instance
import { patents, users, patentInventors } from '@/config/db/schema/patents.ts'; // Import your tables
import { eq } from 'drizzle-orm';
import express from 'express';
import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
const router = express.Router();

const app = express();
app.use(express.json());

app.post('/patents', async (req, res) => {
  const { title, nationality, status, filing_id, filing_date, grant_date, inventors } = req.body;

  if (status !== 'filed' && status !== 'granted') {
    return res.status(400).json({ error: 'Status must be "filed" or "granted"' });
  }

  const requiredFields = status === 'filed'
    ? [title, nationality, status, filing_id, filing_date, inventors]
    : [title, nationality, status, filing_id, grant_date, inventors];

  if (requiredFields.some(field => !field)) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  try {
    // Retrieve user IDs and emails for the given inventor names
    const inventorsData = await Promise.all(
      inventors.map(async (inventorName) => {
        const userData = await db.select({ id: users.id, email: users.email })
          .from(users)
          .where(eq(users.name, inventorName))
          .limit(1);

        if (!userData.length) {
          throw new Error(`User not found: ${inventorName}`);
        }

        return userData[0];
      })
    );

    // Insert the new patent into the 'patents' table
    const [newPatent] = await db
      .insert(patents)
      .values({ title, nationality, status, filing_id, filing_date, grant_date })
      .returning();

    if (!newPatent) {
      return res.status(400).json({ error: 'Failed to insert patent' });
    }

    const patentId = newPatent.patent_id;

    // Insert inventor relationships into the 'patent_inventors' table
    await db.insert(patentInventors).values(
      inventorsData.map(({ id, email }) => ({
        patent_id: patentId,
        user_id: id,
        email: email, // Store email along with user_id
      }))
    );

    // Return the inserted patent data along with inventors' emails
    res.status(201).json({ ...newPatent, inventors: inventorsData });
  } catch (err) {
    console.error('Error inserting patent:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default app;
