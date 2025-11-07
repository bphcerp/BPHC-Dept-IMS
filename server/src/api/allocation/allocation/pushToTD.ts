import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import {
    pushToTDSchema,
    sectionTypes,
} from "../../../../../lib/src/schemas/Allocation.ts";
import environment from "@/config/environment.ts";
import axios from "axios";
import { getLatestSemester } from "../semester/getLatest.ts";
import { OAuth2Client } from "google-auth-library";

const router = Router();
const client = new OAuth2Client(environment.GOOGLE_CLIENT_ID);

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        if (environment.IS_STAGING) {
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "Operation not allowed in staging environment"
                )
            );
        }

        const { sendMultiDepartmentCourses, idToken } = pushToTDSchema.parse(
            req.body
        );

        try {
            await client.verifyIdToken({
                idToken,
                audience: environment.GOOGLE_CLIENT_ID,
            });
        } catch {
            return next(new HttpError(HttpCode.UNAUTHORIZED, "Invalid token"));
        }

        const latestSemester = await getLatestSemester();

        if (!latestSemester) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "There is no current semester set"
                )
            );
        }

        const allocations = await db.query.masterAllocation.findMany({
            where: (ma, { eq }) => eq(ma.semesterId, latestSemester.id),
            columns: {},
            with: {
                sections: {
                    orderBy: (section, { asc }) => [
                        asc(section.type),
                        asc(section.createdAt),
                    ],
                    columns: { type: true, timetableRoomId: true },
                    with: {
                        instructors: {
                            columns: {},
                            with: {
                                instructor: {
                                    columns: {},
                                    with: {
                                        faculty: { columns: { psrn: true } },
                                        phd: { columns: { erpId: true } },
                                    },
                                },
                            },
                        },
                    },
                },
                course: {
                    columns: {
                        offeredAlsoBy: true,
                        code: true,
                        timetableCourseId: true,
                    },
                },
                ic: {
                    columns: {},
                    with: {
                        faculty: { columns: { psrn: true } },
                        phd: { columns: { erpId: true } },
                    },
                },
            },
        });

        const ttdPushData = allocations
            .filter(
                (a) =>
                    a.course.timetableCourseId &&
                    (sendMultiDepartmentCourses || !a.course.offeredAlsoBy)
            )
            .map((allocation) => {
                const sectionNumberMap: Record<
                    (typeof sectionTypes)[number],
                    number
                > = {
                    LECTURE: 0,
                    TUTORIAL: 0,
                    PRACTICAL: 0,
                };

                return {
                    id: allocation.course.timetableCourseId!,
                    active: true,
                    sections: allocation.sections.map((allocationSection) => {
                        sectionNumberMap[allocationSection.type] =
                            sectionNumberMap[allocationSection.type] + 1;
                        return {
                            section: `${allocationSection.type.charAt(0)}${sectionNumberMap[allocationSection.type]}`,
                            instructors: allocationSection.instructors.length
                                ? allocationSection.instructors.map(
                                      (inst) =>
                                          inst.instructor.faculty?.psrn ??
                                          inst.instructor.phd?.erpId
                                  )
                                : [],
                        };
                    }),
                    preferredRooms: allocation.sections.flatMap((s) =>
                        s.timetableRoomId ? [s.timetableRoomId] : []
                    ),
                    ic:
                        allocation.ic?.faculty?.psrn ??
                        allocation.ic?.phd?.erpId ??
                        undefined,
                };
            });

        await Promise.all(
            ttdPushData.map((course) =>
                axios.put(
                    `${environment.TTD_API_URL}/${latestSemester.semesterType}/courses/ims/${course.id}`,
                    course,
                    {
                        headers: {
                            "X-Api-Token": idToken,
                        },
                    }
                )
            )
        );

        res.status(200).json({ message: "Courses pushed successfully." });
    })
);

export default router;
