import { db } from "@/config/db/index.ts; // Import the Drizzle database instance
import { users, excelPatents } from "@/config/db/schema/patents.ts"; // Import table schemas
import xlsx from "xlsx";
import multer from "multer";

const upload = multer(); // Setup multer for file handling

app.post("/insert-patents", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read the Excel file buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const data = xlsx.utils.sheet_to_json(sheet);

    // Extract unique inventor names
    let inventorNames = new Set();
    data.slice(1).forEach((row) => {
      if (row["__EMPTY_1"]) {
        row["__EMPTY_1"].split(",").forEach((name) => {
          inventorNames.add(name.trim());
        });
      }
    });

    // Fetch inventor emails from the users table
    const fetchedUsers = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(users.name.in(Array.from(inventorNames)));

    const emailMap = Object.fromEntries(
      fetchedUsers.map((user) => [user.name, user.email])
    );

    // Process the patent data for insertion
    const cleanedData = data.slice(1).map((row) => ({
      applicationNumber: row["__EMPTY"],
      inventorsName: row["__EMPTY_1"] || "N/A",
      department: row["__EMPTY_2"] || "N/A",
      title: row["__EMPTY_3"] || "N/A",
      campus: row["__EMPTY_4"] || "N/A",
      filingDate: row["__EMPTY_5"] || "N/A",
      applicationPublicationDate: row["__EMPTY_6"] || "N/A",
      grantedDate: row["__EMPTY_7"] || "N/A",
      filingFy: row["__EMPTY_8"] || "N/A",
      filingAy: row["__EMPTY_9"] || "N/A",
      publishedAy: row["__EMPTY_10"] || "N/A",
      publishedFy: row["__EMPTY_11"] || "N/A",
      grantedFy: row["__EMPTY_12"] || "N/A",
      grantedAy: row["__EMPTY_13"] || "N/A",
      grantedCy: row["__EMPTY_14"] || "N/A",
      status: row["__EMPTY_15"] || "N/A",
    }));

    // Insert data using Drizzle
    await db.insert(excelPatents).values(cleanedData);

    res.status(200).json({ message: "Data inserted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
