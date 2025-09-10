
import { z } from "zod";
import {
	allocationSchema,
	courseSchema,
	semesterSchema
} from "../schemas/Allocation.ts";
import { MemberDetailsResponse } from "@/schemas/Admin.ts";

export type NewAllocation = z.infer<typeof allocationSchema>;
export type UpdateAllocation = Partial<NewAllocation>;
export type Allocation = NewAllocation & {
    id: string;
    allocatedOn: Date;
    updatedOn: Date;
    course: Course
    semester: Semester;
    instructor: MemberDetailsResponse;
};

export type NewCourse = z.infer<typeof courseSchema>;
export type UpdateCourse = Partial<NewCourse>;
export type Course = NewCourse & {
    createdAt: Date;
    updatedAt: Date;
};

export type NewSemester = z.infer<typeof semesterSchema>;
export type UpdateSemester = Partial<NewSemester>;
export type Semester = NewSemester & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    dcaConvenerAtStartOfSem: MemberDetailsResponse | null;
    hodAtStartOfSem: MemberDetailsResponse | null;
};