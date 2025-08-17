
import { z } from "zod";
import { allocationSchema } from "../schemas/Allocation.ts";

export type Allocation = z.infer<typeof allocationSchema>;
export type UpdateAllocation = Partial<Allocation>