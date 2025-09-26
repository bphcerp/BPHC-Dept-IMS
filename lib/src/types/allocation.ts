import { z } from "zod";
import {
    allocationSchema,
    allocationSectionSchema,
    courseAllocateSchema,
    courseCodeSchema,
    allocationStatuses,
    courseSchema,
    masterAllocationSchema,
    semesterSchema,
    semesterTypes,
    sectionTypes,
} from "../schemas/Allocation.ts";
import { MemberDetailsResponse } from "../schemas/Admin.ts";
import {
    AllocationForm,
    AllocationFormResponse,
    AllocationFormTemplatePreferenceFieldType,
} from "./allocationFormBuilder.ts";

export type NewAllocation = z.infer<typeof allocationSchema>;
export type UpdateAllocation = Partial<NewAllocation>;
export type Allocation = NewAllocation & {
    id: string;
    allocatedOn: Date;
    updatedOn: Date;
    course: Course;
    semester: Semester;
    instructor: MemberDetailsResponse;
};

export type NewCourse = z.infer<typeof courseSchema>;
export type UpdateCourse = Partial<NewCourse>;
export type Course = NewCourse & {
    createdAt: Date;
    updatedAt: Date;
};

export type SemesterAllocationStatusEnumType =
    (typeof allocationStatuses)[number];
export type SemesterTypeEnumType = (typeof semesterTypes)[number];
export const semesterStatusMap: Record<
    SemesterAllocationStatusEnumType,
    string
> = {
    completed: "Completed",
    notStarted: "Not Started",
    ongoing: "Ongoing",
    suspended: "Suspended",
};

export const semesterTypeMap: Record<SemesterTypeEnumType, string> = {
    "1": "ODD",
    "2": "EVEN",
    "3": "SUMMER",
};

export type NewSemester = Omit<
    z.infer<typeof semesterSchema>,
    "startDate" | "endDate"
> & {
    startDate: string;
    endDate: string;
};
export type UpdateSemester = Partial<NewSemester>;
export type Semester = NewSemester & {
    id: string;
    form: AllocationForm & {
        responses: AllocationFormResponse[]
    };
    createdAt: Date;
    updatedAt: Date;
    dcaConvenerAtStartOfSem: MemberDetailsResponse | null;
    hodAtStartOfSem: MemberDetailsResponse | null;
};

export type MasterAllocation = z.infer<typeof masterAllocationSchema>;
export type AllocationSection = z.infer<typeof allocationSectionSchema>;

export type CourseCodeType = z.infer<typeof courseCodeSchema>;

export type TTDCourse = {
    id: number;
    courseCode: string;
    deptCode: string;
    name: string;
    courseStrength: number;
    totalUnits: number;
    lectureUnits: number;
    labUnits: number;
    active: boolean;
    offeredAs: string;
    offeredBy: string[];
    offeredTo: string;
    offeredToYear: number;
    offeredInSem: number;
    sections: any[];
    preferredRooms: any[];
    textbooks: any[];
};

export type CourseAllocateType = z.infer<typeof courseAllocateSchema>;

export type SectionClient = {
    type: AllocationFormTemplatePreferenceFieldType;
    number?: string;
    instructors: [string, string][];
};

export type TTDDepartment = {
    id: string;
    name: string;
    hodName: string;
    hodPsrn: string;
    dcaConvener: {
        name: string;
        psrn: string;
    };
    delegated: {
        _id: string;
        psrn: string;
        name: string;
    };
};

export type AllocationType = {
    ic: MemberDetailsResponse;
    sections: {
        type: AllocationFormTemplatePreferenceFieldType;
        number: string;
        instructors: {
            instructor: MemberDetailsResponse;
        }[];
    }[];
    courseCode: string;
};

export type AllocationResponse = {
    id: string;
    semesterId: string;
    ic: {
        email: string;
        name: string | null;
    };
    courseCode: string;
    sections: {
        id: string;
        name: string;
        type: (typeof sectionTypes)[number];
        masterId: string;
        instructors: {
            name: string | null;
            email: string;
        }[];
    }[];
} | null;
