import { Request, Response, NextFunction } from "express";
import db from "@/config/db/index.ts";
import { facultyContributions } from "@/config/db/schema/facultyContribution";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";

export const submitContribution = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { designation, startDate, endDate, facultyEmail } = req.body;

    await db.insert(facultyContributions).values({
        designation,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        facultyEmail,
    });

    res.status(201).json({ message: "Contribution submitted successfully" });
});

export const getAllContributions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const contributions = await db.select().from(facultyContributions);
    res.status(200).json(contributions);
});

export const approveContribution = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { contributionId } = req.body;

    await db
        .update(facultyContributions)
        .set({ status: "approved" })
        .where(eq(facultyContributions.id, contributionId));

    res.status(200).json({ message: "Contribution approved successfully" });
});

export const rejectContribution = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { contributionId } = req.body;

    await db
        .update(facultyContributions)
        .set({ status: "rejected" })
        .where(eq(facultyContributions.id, contributionId));

    res.status(200).json({ message: "Contribution rejected successfully" });
});