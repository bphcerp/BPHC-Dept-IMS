import { db } from '@/config/db/index.ts'; // Import your Drizzle database instance
import { excelpatents, users } from '@/config/db/schema/patents.ts; // Import the schema
import express from 'express';

const app = express();
app.use(express.json());

app.post('/addPatentForm', async (req, res) => {
  try {
    // 1) Extract the form data from req.body
    const {
      application_number,
      inventors_name,
      department,
      title,
      campus,
      filing_date,
      application_publication_date,
      granted_date,
      filing_fy,
      filing_ay,
      published_ay,
      published_fy,
      granted_fy,
      granted_ay,
      granted_cy,
      status
    } = req.body;

    // Validate required fields
    if (!application_number || !title || !inventors_name) {
      return res.status(400).json({ error: 'application_number, title, and inventors_name are required' });
    }

    // 2) Parse inventor names into a Set
    let inventorNames = new Set(inventors_name.split(',').map(name => name.trim()));

    // 3) Fetch user emails for these inventors
    const usersData = await db.query.users.findMany({
      where: (user, { inArray }) => inArray(user.name, Array.from(inventorNames)),
      columns: { name: true, email: true }
    });

    if (!usersData) {
      return res.status(500).json({ error: 'Failed to fetch user emails' });
    }

    // Extract emails from the user data
    const emails = usersData.map(user => user.email);

    // 4) Insert new patent into the 'excelpatents' table
    await db.insert(excelpatents).values({
      application_number,
      inventors_name,
      department,
      title,
      campus,
      filing_date,
      application_publication_date,
      granted_date,
      filing_fy,
      filing_ay,
      published_ay,
      published_fy,
      granted_fy,
      granted_ay,
      granted_cy,
      status
    });

    return res.status(200).json({ message: 'Patent inserted successfully via form' });
  } catch (error) {
    console.error('Error in /addPatentForm route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
