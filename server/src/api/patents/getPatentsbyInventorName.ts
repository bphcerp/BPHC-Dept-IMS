import { db } from '@/config/db/index.ts'; // Import Drizzle database instance
import { patents, patentInventors, users } from '@/config/db/schema/patents.ts'; // Import schema
import express from 'express';

const app = express();
app.use(express.json());

app.get('/:name/patents', async (req, res) => {
  try {
    const { name } = req.params;

    // Step 1: Retrieve all patents where the given inventor is associated
    const inventorData = await db.query.users.findFirst({
      where: (user, { eq }) => eq(user.name, name),
      columns: { id: true }
    });

    if (!inventorData) {
      return res.status(404).json({ error: 'Inventor not found' });
    }

    const inventorId = inventorData.id;

    // Step 2: Get all patent IDs linked to this inventor
    const inventorPatents = await db.query.patentInventors.findMany({
      where: (patentInventor, { eq }) => eq(patentInventor.user_id, inventorId),
      columns: { patent_id: true }
    });

    if (!inventorPatents.length) {
      return res.status(200).json([]); // No patents found
    }

    const patentIds = inventorPatents.map((p) => p.patent_id);

    // Step 3: Fetch all patents where patent_id matches
    const patentData = await db.query.patents.findMany({
      where: (patent, { inArray }) => inArray(patent.patent_id, patentIds)
    });

    // Step 4: Fetch inventor details for each patent
    const patentsWithInventors = await Promise.all(
      patentData.map(async (patent) => {
        const associatedInventors = await db.query.patentInventors.findMany({
          where: (pi, { eq }) => eq(pi.patent_id, patent.patent_id),
          columns: { user_id: true }
        });

        const inventorIds = associatedInventors.map((inv) => inv.user_id);

        const inventorDetails = await db.query.users.findMany({
          where: (user, { inArray }) => inArray(user.id, inventorIds),
          columns: { name: true, email: true }
        });

        return { ...patent, inventors: inventorDetails };
      })
    );

    return res.status(200).json(patentsWithInventors);
  } catch (err) {
    console.error('Error retrieving patents:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
