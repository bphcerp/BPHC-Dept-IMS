import { useAuth } from "@/hooks/Auth";
import AdminLayout from "@/layouts/Admin";
import QpReviewLayout from "@/layouts/QpReview";
import MembersView from "@/views/Admin/Members";
import MemberDetailsView from "@/views/Admin/Members/[member]";
import RolesView from "@/views/Admin/Roles";
import RoleDetailsView from "@/views/Admin/Roles/[role]";
import Home from "@/views/Home";
import FicSubmissionView from "@/views/QpReview/FicSubmission";
import DCARequestsView from "@/views/QpReview/DCARequests";
import FacultyReview from "@/views/QpReview/FacultyReview/[course]";
import ReviewPage from "@/views/QpReview/FacultyReview";
import PhdLayout from "@/layouts/Phd/Phd";
import { allPermissions, permissions } from "lib";
import { Computer, FileText, GraduationCap, BookOpen } from "lucide-react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import UpdateGrade from "@/views/Phd/NotionalSupervisor/UpdateGrade";
import CourseworkForm from "@/views/Phd/DrcConvenor/CourseworkForm";
import GenerateQualifyingExamForm from "@/views/Phd/DrcConvenor/GenerateQualifyingExamForm";
import PhdThatAppliedForQualifyingExam from "@/views/Phd/DrcConvenor/PhdThatAppliedForQualifyingExam";
import UpdateSemesterDates from "@/views/Phd/DrcConvenor/UpdateSemesterDates";
import AssignDacMembers from "@/views/Phd/DrcConvenor/AssignDacMemberes";
import FormDeadline from "@/views/Phd/Student/FormDeadline";
import ProposalSubmission from "@/views/Phd/Student/ProposalSubmission";
import CoSupervisedStudents from "@/views/Phd/CoSupervisor/CoSupervisedStudents";
import SupervisedStudents from "@/views/Phd/Supervisor/SupervisedStudents";
import UpdateDeadlinesPage from "@/views/Phd/DrcConvenor/UpdateDeadlines";
import NotFoundPage from "@/layouts/404";
import SubmitHandout from "@/views/Handouts/submitHandout";
import HandoutLayout from "@/layouts/Handouts";
import DCAMemberReviewForm from "@/views/Handouts/dca-review";
import GetAllHandoutsDCAConvenor from "@/views/Handouts/getAllHandoutsDCAConvenor";
import GetAllHandoutsDCA from "@/views/Handouts/getAllHandoutsDCA";
import GetAllHandoutsFaculty from "@/views/Handouts/getAllHandoutsFaculty";
import AssignReviewer from "@/views/Handouts/assignReviewer";

const adminModulePermissions = [
  permissions["/admin/member/search"],
  permissions["/admin/member/details"],
  permissions["/admin/role"],
];

const phdModulePermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("phd:")
);

const qpReviewModulePermissions: string[] = [];

const courseHandoutsPermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("handout:")
);

const Routing = () => {
  const { authState, checkAccess, checkAccessAnyOne } = useAuth();

  const modules = [
    {
      title: "Admin",
      icon: <Computer />,
      url: "/admin",
      requiredPermissions: adminModulePermissions,
    },
    {
      title: "QP Review",
      icon: <FileText />,
      url: "/qpReview",
      requiredPermissions: qpReviewModulePermissions,
    },
    {
      title: "PhD",
      icon: <GraduationCap />,
      url: "/phd",
      requiredPermissions: phdModulePermissions,
    },
    {
      title: "Course Handouts",
      icon: <BookOpen />,
      url: "/handout/faculty",
      requiredPermissions: courseHandoutsPermissions,
    },
  ];

  return (
    <BrowserRouter
      // react-router future version flags, prevents console warnings
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Home
              sidebarItems={
                authState
                  ? [
                      {
                        title: "Modules",
                        items: modules,
                      },
                    ]
                  : []
              }
            />
          }
        />
        {authState && (
          <>
            {checkAccessAnyOne(adminModulePermissions) && (
              <Route path="/admin" element={<AdminLayout />}>
                <Route
                  index
                  element={<Navigate to="/admin/members" replace={true} />}
                />
                {checkAccess(permissions["/admin/member/details"]) && (
                  <>
                    <Route path="members" element={<MembersView />} />
                    <Route
                      path="members/:member"
                      element={<MemberDetailsView />}
                    />
                  </>
                )}
                {checkAccess(permissions["/admin/role"]) && (
                  <>
                    <Route path="roles" element={<RolesView />} />
                    <Route path="roles/:role" element={<RoleDetailsView />} />
                  </>
                )}
              </Route>
            )}

            {checkAccessAnyOne(qpReviewModulePermissions) && (
              <Route path="/qpReview" element={<QpReviewLayout />}>
                <Route
                  index
                  element={
                    <Navigate to="/qpReview/ficSubmission" replace={true} />
                  }
                />
                <Route path="ficSubmission" element={<FicSubmissionView />} />
                <Route path="dcarequests" element={<DCARequestsView />} />
                <Route path="facultyReview" element={<ReviewPage />} />
                <Route
                  path="facultyReview/:course"
                  element={<FacultyReview />}
                />
              </Route>
            )}

            {checkAccessAnyOne(courseHandoutsPermissions) && (
              <Route path="/handout" element={<HandoutLayout />}>
                {checkAccess(permissions["/handout/submit"]) && (
                  <Route path="submit/:id" element={<SubmitHandout />} />
                )}
                {checkAccess(permissions["/handout/faculty/get"]) && (
                  <Route path="faculty" element={<GetAllHandoutsFaculty />} />
                )}
                {checkAccess(permissions["/handout/dca/get"]) && (
                  <>
                    <Route path="dca" element={<GetAllHandoutsDCA />} />
                    {checkAccess(permissions["/handout/dca/review"]) && (
                      <Route
                        path="dca/review/:id"
                        element={<DCAMemberReviewForm />}
                      />
                    )}
                  </>
                )}
                {checkAccess(permissions["/handout/dca/get"]) &&
                  checkAccess(permissions["/handout/dca/assignReviewer"]) && (
                    <>
                      <Route
                        path="dcaconvenor"
                        element={<GetAllHandoutsDCAConvenor />}
                      />
                      <Route
                        path="assignreviewer/:id"
                        element={<AssignReviewer />}
                      />
                    </>
                  )}
              </Route>
            )}

            {checkAccessAnyOne(phdModulePermissions) && (
              <Route path="/phd" element={<PhdLayout />}>
                {checkAccess(
                  permissions["/phd/notionalSupervisor/updateCourseDetails"]
                ) && (
                  <Route path="notional-supervisor" element={<Outlet />}>
                    <Route path="update-grade" element={<UpdateGrade />} />
                  </Route>
                )}
                {checkAccess(
                  permissions["/phd/drcMember/generateCourseworkForm"]
                ) && (
                  <Route path="drc-convenor" element={<Outlet />}>
                    <Route
                      path="coursework-form"
                      element={<CourseworkForm />}
                    />
                    <Route
                      path="update-semester-dates"
                      element={<UpdateSemesterDates />}
                    />
                    <Route
                      path="generate-qualifying-exam-form"
                      element={<GenerateQualifyingExamForm />}
                    ></Route>
                    <Route
                      path="phd-that-applied-for-qualifying-exam"
                      element={<PhdThatAppliedForQualifyingExam />}
                    ></Route>
                    <Route
                      path="update-deadlines"
                      element={<UpdateDeadlinesPage />}
                    />
                    <Route
                      path="assign-dac-members"
                      element={<AssignDacMembers />}
                    ></Route>
                    Handout
                  </Route>
                )}
                {checkAccess(permissions["/phd/student/checkExamStatus"]) && (
                  <Route path="phd-student" element={<Outlet />}>
                    <Route path="form-deadline" element={<FormDeadline />} />

                    <Route
                      path="proposal-submission"
                      element={<ProposalSubmission />}
                    />
                  </Route>
                )}
                {checkAccess(
                  permissions[
                    "/phd/notionalSupervisor/updateCourseDetails"
                  ] as string
                ) && (
                  <Route path="phd-co-supervisor" element={<Outlet />}>
                    <Route
                      path="co-supervised-students"
                      element={<CoSupervisedStudents />}
                    />
                  </Route>
                )}
                {checkAccess(
                  permissions[
                    "/phd/notionalSupervisor/updateCourseDetails"
                  ] as string
                ) && (
                  <Route path="phd-supervisor" element={<Outlet />}>
                    <Route
                      path="supervised-students"
                      element={<SupervisedStudents />}
                    />
                  </Route>
                )}
              </Route>
            )}
          </>
        )}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Routing;
