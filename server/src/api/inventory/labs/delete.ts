import db from "@/config/db/index.ts";
import { laboratories } from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.delete('/:id', checkAccess(), asyncHandler(async (req, res) => {
    await db.delete(laboratories).where(eq(laboratories.id, req.params.id));
    res.status(200).json({ message: 'Laboratory deleted successfully' });
}));

export default router;
