// src/schemas/application.ts
import { z } from "zod";

export const applicationSchema = z
  .object({
    courseCode: z.string().nonempty("Course Code is required"),
    courseName: z.string().nonempty("Course Name is required"),
    openBook: z
      .string()
      .nonempty("Open Book percentage is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Open Book percentage should be a non negative number",
      }),
    closedBook: z
      .string()
      .nonempty("Closed Book percentage is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Closed Book percentage should be a non negative number",
      }),
    midSem: z.string().nonempty("Midsemester Weightage is required"),
    compre: z.string().nonempty("Comprehensive Weightage is required"),
    frequency: z
      .string()
      .nonempty("Frequency is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Frequency must be a non negative number",
      }),
    numComponents: z
      .string()
      .nonempty("Number of components is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Number of components must be a positive number",
      }),
  })
  .refine((val) => Number(val.openBook) + Number(val.closedBook) === 100, {
    message: "Open Book and Closed Book percentages must add up to 100",
    path: ["openBook", "closedBook"],
  });
