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
    degreeTypes,
} from "../schemas/Allocation.ts";
import { MemberDetailsResponse, userTypes } from "../schemas/Admin.ts";
import {
    AllocationForm,
    AllocationFormResponse,
    AllocationFormTemplatePreferenceFieldType,
} from "./allocationFormBuilder.ts";
import { courseGroupSchema } from "../schemas/Allocation.js";

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
export type CourseAllocationStatusResponse = Record<
    string,
    "Allocated" | "Pending" | "Not Started"
>;

export type NewCourse = z.infer<typeof courseSchema>;
export type UpdateCourse = Partial<NewCourse>;
export type Course = NewCourse & {
    fetchedFromTTD: boolean;
    createdAt: Date;
    updatedAt: Date;
    groups?: Omit<CourseGroup, "courses">[] | null;
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
    formCollection: "Collecting Responses",
    inAllocation: "In Allocation",
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
    summaryHidden: boolean;
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

type SemesterResponseStat = {
    email: string;
    name: string | null;
    type: "faculty" | "phd";
};

export type AllocationStat = {
    notStarted: number;
    pending: number;
    completed: number;
};

export type SemesterWithStats = Semester & {
    notResponded?: SemesterResponseStat[];
    allocationStats?: {
        [Key in (typeof degreeTypes)[number]]: AllocationStat;
    };
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
    dcaConvener: string;
    delegated: string;
    freezeStatus: boolean;
};

export type AllocationType = {
    ic: MemberDetailsResponse | null;
    sections: {
        type: AllocationFormTemplatePreferenceFieldType;
        number: string;
        instructors: {
            instructor: MemberDetailsResponse;
        }[];
    }[];
    courseCode: string;
};

export type TTDRoom = {
    id: string;
    block: string;
    roomNumber: string;
    classCapacity: number;
    examCapacity: number;
    roomType: string;
    departmentSpecification: string[];
    impartus: boolean;
    mic: boolean;
    speaker: boolean;
    projector: boolean;
    smartBoard: boolean;
    smartMonitor: boolean;
    biometric: boolean;
};

export type AllocationResponse = {
    id: string;
    semesterId: string;
    ic: {
        email: string;
        name: string | null;
    } | null;
    courseCode: string;
    course: Pick<Course, "name">;
    sections: {
        id: string;
        type: (typeof sectionTypes)[number];
        masterId: string;
        createdAt: string;
        instructors: {
            name: string | null;
            email: string;
            psrn?: string;
            type: "faculty" | "phd";
        }[];
        timetableRoomId: string;
    }[];
} | null;

export type AllocationSummaryType = (NonNullable<AllocationResponse> & {
    course: Course;
})[];

export type InstructorWithPreference = {
    email: string;
    name: string | null;
    preference?: number | null;
    type: "faculty" | "phd";
};

export type InstructorAllocationDetails = Record<
    (typeof sectionTypes)[number],
    {
        id: string;
        type: (typeof sectionTypes)[number];
        createdAt: Date;
        instructors: {
            email: string;
            name: string | null;
            type: (typeof userTypes)[number];
        }[];
        master: {
            id: string;
            course: {
                name: string;
                lectureUnits: number;
                practicalUnits: number;
                code: string;
            };
            ic: string | null;
        };
    }[]
>;

export type NewCourseGroup = z.infer<typeof courseGroupSchema>;
export type CourseGroup = NewCourseGroup & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    courses: Pick<Course, "name" | "code">[];
};
export type CourseGroupMinimal = Omit<CourseGroup, "courses">;
