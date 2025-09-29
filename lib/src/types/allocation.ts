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
    fetchedFromTTD: boolean
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
    "3": "SUMMER TERM",
};

export type NewSemester = Omit<
    z.infer<typeof semesterSchema>,
    "startDate" | "endDate"
> & {
    startDate: string;
    endDate: string;
};
export type UpdateSemester = Partial<NewSemester>;

export type SemesterMinimal = NewSemester & {
    id: string;
    formId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type Semester = SemesterMinimal & {
    form: AllocationForm & {
        responses: AllocationFormResponse[];
    };
    hodAtStartOfSem: {
        name: string | null;
        email: string;
    } | null;
    dcaConvenerAtStartOfSem: {
        name: string | null;
        email: string;
    } | null;
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
        type: (typeof sectionTypes)[number];
        masterId: string;
        createdAt: string;
        instructors: {
            name: string | null;
            email: string;
        }[];
    }[];
} | null;

export type InstructorAllocationSection = {
    id: string;
    type: (typeof sectionTypes)[number];
    masterId: string;
    createdAt: Date;
    instructors: {
        sectionId: string;
        instructorEmail: string;
        createdAt: Date;
        instructor: {
            email: string;
            name: string | null;
            phone: string | null;
            designation: string | null;
            department: string | null;
        };
    }[];
};

export type InstructorAllocationMaster = {
    id: string;
    semesterId: string;
    ic: string;
    courseCode: string;
    course: {
        code: string;
        name: string;
        lectureUnits: number;
        practicalUnits: number;
        totalUnits: number | null;
        offeredAs: "CDC" | "Elective";
        offeredTo: "FD" | "HD";
        offeredAlsoBy: string[] | null;
        createdAt: Date | null;
        updatedAt: Date | null;
    };
    sections: Record<
        (typeof sectionTypes)[number],
        InstructorAllocationSection[]
    >;
};

export type InstructorAllocationSections = Record<
    (typeof sectionTypes)[number],
    {
        type: (typeof sectionTypes)[number];
        createdAt: Date;
        master: {
            id: string;
            courseCode: string;
            ic: string;
        };
    }[]
>;

export type InstructorAllocationDetails = {
    allAllocationsOfCoursesAllocatedToUser: InstructorAllocationMaster[];
    userAllocatedSections: InstructorAllocationSections;
};
