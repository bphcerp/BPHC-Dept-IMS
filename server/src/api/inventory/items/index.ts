import { Router } from "express";
import getItems from "./get.ts";
import createItem from "./create.ts";
import updateItem from "./update.ts";
import deleteItem from "./delete.ts";

const router = Router();

router.use('/get', getItems);
router.use('/create', createItem);
router.use('/update', updateItem);
router.use('/delete', deleteItem);

export default router;
