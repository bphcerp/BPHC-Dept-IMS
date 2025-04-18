import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, _next) => {
        const headers = [
            "S.No",
            "Course Code",
            "Course Name",
            "Instructor In Charge",
            "Scope And Objective is written clearly",
            "Textbook(s) prescribed is of good repute for the course and approved by DCA",
            "Lecture wise Plan along with Learning Objectives is articulated in detail",
            "Lecture wise Plan is covering all the topics as per the course description given in the bulletin",
            "Number of Lectures/Practical are adequate as per the Units of the Course",
            "Evaluation Scheme is as per academic regulations",
        ];
        const handouts = (
            await db.query.courseHandoutRequests.findMany({
                where: (handout, { eq }) => eq(handout.status, "approved"),
                with: {
                    ic: {
                        with: {
                            faculty: true,
                        },
                    },
                },
            })
        ).map((handout, i) => {
            return {
                [headers[0]]: i + 1,
                [headers[1]]: handout.courseCode,
                [headers[2]]: handout.courseName,
                [headers[3]]: handout.ic?.faculty?.name,
                [headers[4]]:
                    handout.scopeAndObjective == true ? "\u2713" : "\u00D7",
                [headers[5]]:
                    handout.textBookPrescribed == true ? "\u2713" : "\u00D7",
                [headers[6]]:
                    handout.lecturewisePlanLearningObjective == true
                        ? "\u2713"
                        : "\u00D7",
                [headers[7]]:
                    handout.lecturewisePlanCourseTopics == true
                        ? "\u2713"
                        : "\u00D7",
                [headers[8]]: handout.numberOfLP == true ? "\u2713" : "\u00D7",
                [headers[9]]:
                    handout.evaluationScheme == true ? "\u2713" : "\u00D7",
            };
        });

        res.status(200).json({
            success: true,
            headers,
            handouts,
        });
    })
);

export default router;
