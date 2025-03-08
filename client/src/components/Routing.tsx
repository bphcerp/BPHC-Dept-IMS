import { useAuth } from "@/hooks/Auth";
import AdminLayout from "@/layouts/Admin";
import QpReviewLayout from "@/layouts/QpReview";
import CourseHandoutLayout from "@/layouts/CourseHandoutLayout";
import Admin from "@/views/Admin";
import FacultyView from "@/views/CourseHandouts/Faculty/FacultyView";
import MembersView from "@/views/Admin/Members";
import MemberDetailsView from "@/views/Admin/Members/[member]";
import RolesView from "@/views/Admin/Roles";
import RoleDetailsView from "@/views/Admin/Roles/[role]";
import Home from "@/views/Home";
import FicSubmissionView from "@/views/QpReview/FicSubmission";
import { permissions } from "lib";
import { Computer, FileText,BookOpen } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const adminModulePermissions = [
  permissions["/admin/member/search"],
  permissions["/admin/member/details"],
  permissions["/admin/role"],
];

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
      title: "Course Handouts",
      icon: <BookOpen />,
      url: "/handouts",
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
              </Route>
            )}
            {checkAccessAnyOne(qpReviewModulePermissions) && (
              <Route path="/handouts" element={<CourseHandoutLayout />}>
                <Route index element={<Navigate to="/handouts/faculty" />} />
                <Route path="faculty" element={<FacultyView />} />
              </Route>
            )}            
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default Routing;
