import { useAuth } from "@/hooks/Auth";
import AdminLayout from "@/layouts/Admin";
import QpReviewLayout from "@/layouts/QpReview";
import Admin from "@/views/Admin";
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
import Phd from "@/views/Phd";
import { allPermissions, permissions } from "lib";
import { Computer, FileText, GraduationCap } from "lucide-react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import UpdateGrade from "@/views/Phd/NotionalSupervisor/UpdateGrade";
import CourseworkForm from "@/views/Phd/DrcConvenor/CourseworkForm";
import UpdateQualifyingExamDeadline from "@/views/Phd/DrcConvenor/UpdateQualifyingExamDeadline";
import GenerateQualifyingExamForm from "@/views/Phd/DrcConvenor/GenerateQualifyingExamForm";
import PhdThatAppliedForQualifyingExam from "@/views/Phd/DrcConvenor/PhdThatAppliedForQualifyingExam";
import UpdateQualifyingExamResultsOfAllStudents from "@/views/Phd/DrcConvenor/UpdateQualifyingExamResultsOfAllStudents";
import UpdateQualifyingExamPassingDates from "@/views/Phd/DrcConvenor/UpdateQualifyingExamPassingDates";
import UpdateProposalDeadline from "@/views/Phd/DrcConvenor/UpdateProposalDeadline";
import UpdateSemesterDates from "@/views/Phd/DrcConvenor/UpdateSemesterDates";
import AssignDacMembers from "@/views/Phd/DrcConvenor/AssignDacMemberes";
import FormDeadline from "@/views/Phd/Student/FormDeadline";
import QualifyingExamStatus from "@/views/Phd/Student/QualifyingExamStatus";
import ProposalSubmission from "@/views/Phd/Student/ProposalSubmission";
import CoSupervisedStudents from "@/views/Phd/CoSupervisor/CoSupervisedStudents";
import SupervisedStudents from "@/views/Phd/Supervisor/SupervisedStudents";
const adminModulePermissions = [
  permissions["/admin/member/search"],
  permissions["/admin/member/details"],
  permissions["/admin/role"],
];

const phdModulePermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("phd:")
);

const qpReviewModulePermissions: string[] = [];

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
                <Route index element={<Admin />} />
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
                  element={<Navigate to="/qpReview/ficSubmission" />}
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

            {checkAccessAnyOne(phdModulePermissions) && (
              <Route path="/phd" element={<PhdLayout />}>
                <Route index element={<Phd />} />
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
                      path="update-qualifying-exam-deadline"
                      element={<UpdateQualifyingExamDeadline />}
                    ></Route>
                    <Route
                      path="generate-qualifying-exam-form"
                      element={<GenerateQualifyingExamForm />}
                    ></Route>
                    <Route
                      path="phd-that-applied-for-qualifying-exam"
                      element={<PhdThatAppliedForQualifyingExam />}
                    ></Route>
                    <Route
                      path="update-qualifying-exam-results-of-all-students"
                      element={<UpdateQualifyingExamResultsOfAllStudents />}
                    ></Route>
                    <Route
                      path="update-qualifying-exam-passing-dates"
                      element={<UpdateQualifyingExamPassingDates />}
                    ></Route>
                    <Route
                      path="update-proposal-deadline"
                      element={<UpdateProposalDeadline />}
                    ></Route>
                    <Route
                      path="assign-dac-members"
                      element={<AssignDacMembers />}
                    ></Route>
                  </Route>
                )}
                {checkAccess(permissions["/phd/student/checkExamStatus"]) && (
                  <Route path="phd-student" element={<Outlet />}>
                    <Route path="form-deadline" element={<FormDeadline />} />
                    <Route
                      path="exam-status"
                      element={<QualifyingExamStatus />}
                    />
                    <Route path="proposal-submission" element={<ProposalSubmission />} />
                  </Route>
                )}
                 {checkAccess(permissions["/phd/notionalSupervisor/updateCourseDetails"] as string) && (
                  <Route path="phd-co-supervisor" element={<Outlet />}>
                    <Route path="co-supervised-students" element={<CoSupervisedStudents />} />
                  </Route>
                 )}
                 {checkAccess(permissions["/phd/notionalSupervisor/updateCourseDetails"] as string) && (
                  <Route path="phd-supervisor" element={<Outlet />}>
                    <Route path="supervised-students" element={<SupervisedStudents />} />
                  </Route>
                 )}
              </Route>
            )}
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default Routing;
