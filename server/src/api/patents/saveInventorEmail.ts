import { db } from '@/config/db/index.ts'; // Import your Drizzle database instance
import { users } from '@/config/db/schema/patents.ts'; // Import your schema
import express from 'express';

const app = express();
app.use(express.json());

app.patch("/saveInventorEmail", async (req, res) => {
  const { inventorName, newEmail } = req.body;

  if (!inventorName || !newEmail) {
    console.error("Missing inventorName or newEmail");
    return res.status(400).json({ error: "Inventor name and new email are required" });
  }

  try {
    // 1) Check if the user already exists in 'users'
    const existingUser = await db.query.users.findFirst({
      where: (user, { eq }) => eq(user.name, inventorName.trim()),
    });

    let user;

    if (!existingUser) {
      // 2) If user doesn't exist, create one
      const [newUser] = await db.insert(users)
        .values({ name: inventorName.trim(), email: newEmail.trim() })
        .returning(); // Returns the inserted user

      user = newUser;
    } else {
      // 3) If user exists, update their email
      const [updatedUser] = await db.update(users)
        .set({ email: newEmail.trim() })
        .where((user, { eq }) => eq(user.id, existingUser.id))
        .returning(); // Returns the updated user

      user = updatedUser;
    }

    return res.json({ success: true, user });
  } catch (err) {
    console.error("Error in /saveInventorEmail route:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
