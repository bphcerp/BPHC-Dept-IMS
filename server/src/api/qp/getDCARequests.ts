// import express from "express";
// import db from "@/config/db/index.ts";
// import { asyncHandler } from "@/middleware/routeHandler.ts";
// // import { checkAccess } from "@/middleware/auth.ts";

// const router = express.Router();

// router.get(
//     "/:dcaMemberEmail",

//     asyncHandler(async (req, res) => {
//         const { dcaMemberEmail } = req.params;

//         const requests = (
//             await db.query.qpReviewRequests.findMany({
//                 where: (request, { eq }) =>
//                     eq(request.dcaMemberEmail, dcaMemberEmail),
//                 with: {
//                     fic: {
//                         with: {
//                             faculty: true,
//                         },
//                     },
//                 },
//                 orderBy: (request, { desc }) => [desc(request.createdAt)],
//             })
//         ).map((request) => ({
//             id: request.id,
//             courseName: request.courseName,
//             courseCode: request.courseCode,
//             reviewer1: request.faculty1Email,
//             reviewer2: request.faculty2Email,
//             professor: request.fic?.faculty.name,
//             status: request.status,
//             reviewed: request.reviewed,
//         }));

//         res.status(200).json({
//             success: true,
//             message: `Fetched ${requests.length} requests for DCA member: ${dcaMemberEmail}`,
//             data: requests,
//         });
//     })
// );

// export default router;
