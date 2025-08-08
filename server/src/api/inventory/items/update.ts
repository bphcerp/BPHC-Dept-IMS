import db from "@/config/db/index.ts";
import { inventoryItems } from "@/config/db/schema/inventory.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { inventoryItemSchema } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.patch(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = inventoryItemSchema.partial().parse(req.body);

        if (parsed.quantity){
            return next(new HttpError(HttpCode.FORBIDDEN, "Cannot modify the quantity"))
        }

        const itemToBeUpdated = await db.query.inventoryItems.findFirst({
            where: (inventoryItems, { eq }) => eq(inventoryItems.id, req.params.id)
        });

        if (!itemToBeUpdated) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Item not found. Cannot modify."))
        }
        
        const updatedAt = new Date();

        let equipmentID = itemToBeUpdated.equipmentID
        let categoryCode: string


        if (parsed.itemCategoryId) {
            const category = await db.query.inventoryCategories.findFirst({
                where: (categories, { eq }) => eq(categories.id, parsed.itemCategoryId!)
            });
            const equipmentIDSplit = equipmentID.split('/')

            // The category code is changed to the updated one
            equipmentIDSplit[3] = category!.code
            categoryCode = category!.code
            equipmentID = equipmentIDSplit.join('/')
            parsed.equipmentID = equipmentID
        }
        if (parsed.labId) {
            return next(new HttpError(HttpCode.FORBIDDEN, "Lab cannot be updated for a item once set. Please delete the record and enter again."))
        }

        //

        if (itemToBeUpdated.quantity > 1) {
            const items = await db.query.inventoryItems.findMany({
                where: (inventoryItems, { eq, and }) =>
                    and(
                        eq(inventoryItems.serialNumber, itemToBeUpdated.serialNumber),
                        eq(inventoryItems.labId, itemToBeUpdated.labId)
                    )
            });

            let updatedItems;

            await db.transaction(async (tx) => {
                updatedItems = await Promise.all(
                    items.map(async (item) => {
                        let updatedItem = parsed;
                        if (itemToBeUpdated.itemCategoryId) {
                            const equipmentIDSplit = item.equipmentID.split('/')

                            // The category code is changed to the updated one
                            equipmentIDSplit[3] = categoryCode
                            equipmentID = equipmentIDSplit.join('/')
                            updatedItem = { ...parsed, equipmentID }

                        }
                        return await tx
                            .update(inventoryItems)
                            .set({ ...updatedItem, updatedAt})
                            .where(eq(inventoryItems.id, item.id))
                            .returning();
                    })
                );
            });

            res.status(200).json(updatedItems);

        }
        else {
            const updatedItem = await db
                .update(inventoryItems)
                .set({ ...parsed, updatedAt })
                .where(eq(inventoryItems.id, req.params.id))
                .returning();
            res.status(200).json(updatedItem);
        }
    })
);

export default router;
