import { Router } from "express";
import getLabYearStats from './lab-year.ts'
import getLabCategoryStats from './lab-category.ts'
import getVendorYearStats from './vendor-year.ts'
import getVendorCategories from './vendor-categories.ts'
import getImportantDates from './important-dates.ts'

const router = Router()

router.use("/lab-year", getLabYearStats);
router.use("/important-dates", getImportantDates);
router.use("/lab-category", getLabCategoryStats);
router.use("/vendor-year", getVendorYearStats);
router.use("/vendor-categories", getVendorCategories);

export default router;