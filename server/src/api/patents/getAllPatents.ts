import { db } from '@/config/db/index.ts; // Import your Drizzle database instance
import { excelPatents, users } from '@/config/db/schema/patents.ts'; // Import your tables
import { inArray } from 'drizzle-orm';
import express from 'express';

const app = express();
app.use(express.json());

app.get('/Allpatents', async (req, res) => {
  try {
    // Fetch all patents
    const patentsData = await db.select().from(excelPatents);

    if (!patentsData.length) {
      return res.status(404).json({ error: "No patents found" });
    }

    // Extract all inventor names from patents
    let inventorNames = new Set();
    patentsData.forEach(patent => {
      if (patent.inventors_name) {
        patent.inventors_name.split(',').forEach(name => {
          inventorNames.add(name.trim());
        });
      }
    });

    // Fetch emails of inventors from users table
    const usersData = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.name, Array.from(inventorNames)));

    // Create a mapping of inventor names to emails
    const emailMap = Object.fromEntries(usersData.map(user => [user.name, user.email]));

    // Attach emails to inventors
    const enrichedPatents = patentsData.map(patent => {
      let inventorDetails = (patent.inventors_name || '').split(',').map(name => {
        name = name.trim();
        return `${name} (${emailMap[name] || "No Email"})`;
      }).join(', ');

      return { ...patent, inventors_with_email: inventorDetails };
    });

    res.status(200).json(enrichedPatents);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
