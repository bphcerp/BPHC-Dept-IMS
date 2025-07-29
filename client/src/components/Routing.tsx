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
import {
  Computer,
  FileText,
  GraduationCap,
  BookOpen,
  LibraryBig,
  Warehouse,
  File,
} from "lucide-react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import UpdateGrade from "@/views/Phd/NotionalSupervisor/UpdateGrade";
import CourseworkForm from "@/views/Phd/DrcConvenor/CourseworkForm";
import UpdateSemesterDates from "@/views/Phd/Staff/UpdateSemesterDates";
import AssignDacMembers from "@/views/Phd/DrcConvenor/AssignDacMemberes";
import FormDeadline from "@/views/Phd/Student/FormDeadline";
import ProposalSubmission from "@/views/Phd/Student/ProposalSubmission";
import Profile from "@/views/Phd/Student/Profile";
import CoSupervisedStudents from "@/views/Phd/CoSupervisor/CoSupervisedStudents";
import SupervisedStudents from "@/views/Phd/Supervisor/SupervisedStudents";
import UpdateDeadlinesPage from "@/views/Phd/Staff/UpdateDeadlines";
import NotFoundPage from "@/layouts/404";
import ConferenceLayout from "@/layouts/Conference";
import ConferenceApplyView from "@/views/Conference/Apply";
import HandoutLayout from "@/layouts/Handouts";
import DCAMemberReviewForm from "@/views/Handouts/DCAReview";
import DCAConvenorHandouts from "@/views/Handouts/DCAConvenorHandouts";
import DCAMemberHandouts from "@/views/Handouts/DCAMemberHandouts";
import FacultyHandouts from "@/views/Handouts/FacultyHandouts";
import UpdateSubAreasPage from "@/views/Phd/Staff/UpdateSubAreas";
import FacultyHandout from "@/views/Handouts/FacultyHandout";
import SuggestExaminer from "@/views/Phd/NotionalSupervisor/SuggestExaminer";
import DCAConvenorReview from "@/views/Handouts/DCAConvenorReview";
import ConferenceSubmittedApplicationsView from "@/views/Conference/Submitted";
import DCAConvenerSummary from "@/views/Handouts/SummaryPage";
import ConferenceViewApplicationView from "@/views/Conference/View/[id]";
import ConferencePendingApplicationsView from "@/views/Conference/Pending";
import ConferenceEditView from "@/views/Conference/Submitted/[id]";
import PublicationsLayout from "@/layouts/Publications";
import YourPublications from "@/views/Publications/YourPublications";
import AllPublications from "@/views/Publications/AllPublications";
import EditPublications from "@/views/Publications/EditPublications";
import QualifyingExamManagement from "@/views/Phd/DrcConvenor/QualifyingExamManagement";
import InventoryLayout from "@/layouts/Inventory";
import Settings from "@/views/Inventory/Settings";
import { ItemsView } from "@/views/Inventory/ItemsView";
import AddInventoryItem from "@/views/Inventory/AddInventoryItem";
import BulkAddView from "@/views/Inventory/BulkAddView";
import Stats from "@/views/Inventory/Stats";
import ProfilePage from "@/views/Profile/ProfilePage";
import ContributorsPage from "@/views/Contributors";
import ProjectLayout from "@/layouts/Project";
import AddProject from "@/views/Project/AddProject";
import ProjectDetails from "@/views/Project/[id]";
import YourProjects from "@/views/Project/YourProjects";
import AllProjects from "@/views/Project/AllProjects";
import EditProjects from "@/views/Project/EditProjects";
import PatentLayout from "@/layouts/Patent";
import AddPatent from "@/views/Patent/AddPatent";
import PatentDetails from "@/views/Patent/[id]";
import YourPatents from "@/views/Patent/YourPatents";
import AllPatents from "@/views/Patent/AllPatents";
import EditPatents from "@/views/Patent/EditPatents";


const adminModulePermissions = [
  permissions["/admin/member/search"],
  permissions["/admin/member/details"],
  permissions["/admin/role"],
];

const phdModulePermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("phd:")
);

const conferenceModulePermissions: string[] = Object.keys(
  allPermissions
).filter((permission) => permission.startsWith("conference:"));

const qpReviewModulePermissions: string[] = ["qp:"];

const courseHandoutsPermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("handout:")
);

const publicationsPermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("publications:")
);

const inventoryModulePermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("inventory:")
);

const projectModulePermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("project:")
);

const patentModulePermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("patent:")
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
      title: "Conference Approval",
      icon: <FileText />,
      url: "/conference",
      requiredPermissions: conferenceModulePermissions,
    },
    {
      title: "Course Handouts",
      icon: <BookOpen />,
      url: "/handout/faculty",
      requiredPermissions: courseHandoutsPermissions,
    },
    {
      title: "Publications",
      icon: <LibraryBig />,
      url: "/publications",
      requiredPermissions: publicationsPermissions,
    },
    {
      title: "Inventory",
      icon: <Warehouse />,
      url: "/inventory",
      requiredPermissions: inventoryModulePermissions,
    },
    {
      title: "Project",
      icon: <File />,
      url: "/project",
      requiredPermissions: projectModulePermissions,
    },
    {
      title: "Patent",
      icon: <File />,
      url: "/patent",
      requiredPermissions: patentModulePermissions,
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
        <Route path="/contributors" element={<ContributorsPage />} />
        {!authState && <Route path="*" element={<Navigate to="/" />} />}

        {authState && <Route path="/profile" element={<ProfilePage />} />}

        {checkAccessAnyOne(adminModulePermissions) && (
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={<Navigate to="/admin/members" replace={true} />}
            />
            {checkAccess(permissions["/admin/member/details"]) && (
              <>
                <Route path="members" element={<MembersView />} />
                <Route path="members/:member" element={<MemberDetailsView />} />
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

        {checkAccessAnyOne(conferenceModulePermissions) && (
          <Route path="/conference" element={<ConferenceLayout />}>
            <Route index element={<Navigate to="/conference/apply" />} />
            {checkAccess(permissions["/conference/createApplication"]) && (
              <Route path="apply" element={<ConferenceApplyView />} />
            )}
            {checkAccess(permissions["/conference/applications/my"]) && (
              <>
                <Route
                  path="submitted"
                  element={<ConferenceSubmittedApplicationsView />}
                />
                <Route path="submitted/:id" element={<ConferenceEditView />} />
              </>
            )}
            {checkAccess(permissions["/conference/applications/pending"]) && (
              <>
                <Route
                  path="pending"
                  element={<ConferencePendingApplicationsView />}
                />
                <Route
                  path="view/:id"
                  element={<ConferenceViewApplicationView />}
                />
              </>
            )}
          </Route>
        )}

        {checkAccessAnyOne(qpReviewModulePermissions) && (
          <Route path="/qpReview" element={<QpReviewLayout />}>
            <Route
              index
              element={<Navigate to="/qpReview/ficSubmission" replace={true} />}
            />
            <Route path="ficSubmission" element={<FicSubmissionView />} />
            <Route path="dcarequests" element={<DCARequestsView />} />
            <Route path="facultyReview" element={<ReviewPage />} />
            <Route path="facultyReview/:course" element={<FacultyReview />} />
          </Route>
        )}

        {checkAccessAnyOne(courseHandoutsPermissions) && (
          <Route path="/handout" element={<HandoutLayout />}>
            {checkAccess(permissions["/handout/faculty/get"]) &&
              checkAccess(permissions["/handout/faculty/submit"]) && (
                <Route path="faculty" element={<FacultyHandouts />} />
              )}
            {checkAccess(permissions["/handout/get"]) && (
              <Route path=":id" element={<FacultyHandout />} />
            )}
            {checkAccess(permissions["/handout/dca/get"]) && (
              <>
                <Route path="dca" element={<DCAMemberHandouts />} />
                {checkAccess(permissions["/handout/dca/review"]) &&
                  checkAccess(permissions["/handout/get"]) && (
                    <Route
                      path="dca/review/:id"
                      element={<DCAMemberReviewForm />}
                    />
                  )}
              </>
            )}
            {checkAccess(permissions["/handout/dcaconvenor/get"]) &&
              checkAccess(permissions["/handout/dca/assignReviewer"]) &&
              checkAccess(
                permissions["/handout/dcaconvenor/getAllDCAMember"]
              ) && (
                <>
                  {checkAccess(
                    permissions["/handout/dcaconvenor/updateReviewer"]
                  ) &&
                    checkAccess(
                      permissions["/handout/dcaconvenor/updateIC"]
                    ) && (
                      <Route
                        path="dcaconvenor"
                        element={<DCAConvenorHandouts />}
                      />
                    )}
                  {checkAccess(
                    permissions["/handout/dcaconvenor/exportSummary"]
                  ) && (
                    <Route path="summary" element={<DCAConvenerSummary />} />
                  )}
                  {checkAccess(
                    permissions["/handout/dcaconvenor/finalDecision"]
                  ) && (
                    <Route
                      path="dcaconvenor/review/:id"
                      element={<DCAConvenorReview />}
                    />
                  )}
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
                <Route path="suggest-examiner" element={<SuggestExaminer />} />
              </Route>
            )}
            {checkAccess(
              permissions["/phd/drcMember/generateCourseworkForm"]
            ) && (
              <Route path="drc-convenor" element={<Outlet />}>
                <Route path="coursework-form" element={<CourseworkForm />} />
                <Route
                  path="assign-dac-members"
                  element={<AssignDacMembers />}
                ></Route>
                <Route
                  path="qualifying-exam-management"
                  element={<QualifyingExamManagement />}
                ></Route>
                Handout
              </Route>
            )}
            {checkAccess(permissions["/phd/student/checkExamStatus"]) && (
              <Route path="phd-student" element={<Outlet />}>
                <Route path="form-deadline" element={<FormDeadline />} />
                <Route path="my-profile" element={<Profile />} />

                <Route
                  path="proposal-submission"
                  element={<ProposalSubmission />}
                />
              </Route>
            )}
            {checkAccess(permissions["/phd/staff/getAllSem"]) && (
              <Route path="staff" element={<Outlet />}>
                <Route
                  path="update-semester-dates"
                  element={<UpdateSemesterDates />}
                />
                <Route
                  path="update-deadlines"
                  element={<UpdateDeadlinesPage />}
                />
                <Route
                  path="update-subareas"
                  element={<UpdateSubAreasPage />}
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

        {checkAccessAnyOne(publicationsPermissions) && (
          <Route path="/publications" element={<PublicationsLayout />}>
            <Route
              index
              element={
                <Navigate to="/publications/your-publications" replace={true} />
              }
            />
            <Route path="your-publications" element={<YourPublications />} />
            {checkAccess(permissions["/publications/all"]) && (
              <Route path="all-publications" element={<AllPublications />} />
            )}
            {checkAccess(permissions["/publications/all"]) && (
              <Route path="edit-publications" element={<EditPublications />} />
            )}
          </Route>
        )}

        {checkAccessAnyOne(inventoryModulePermissions) && (
          <Route path="/inventory" element={<InventoryLayout />}>
            <Route
              index
              element={<Navigate to="/inventory/items" replace={true} />}
            />
            <Route path="items" element={<ItemsView />} />
            {checkAccessAnyOne(
              Object.keys(permissions).filter((perm) =>
                perm.startsWith("inventory:stats")
              )
            ) && <Route path="stats" element={<Stats />} />}
            {checkAccess("inventory:write") && (
              <>
                <Route path="items/add-item" element={<AddInventoryItem />} />
                <Route path="items/add-item/excel" element={<BulkAddView />} />
              </>
            )}
            <Route path="stats" element={<></>} />
            {checkAccess("inventory:write") && (
              <Route path="settings" element={<Settings />} />
            )}
          </Route>
        )}

        {checkAccessAnyOne(inventoryModulePermissions) && (
          <Route path="/inventory" element={<InventoryLayout />}>
            <Route
              index
              element={<Navigate to="/inventory/items" replace={true} />}
            />
            <Route path="items" element={<ItemsView />} />
            {checkAccessAnyOne(
              Object.keys(permissions).filter((perm) =>
                perm.startsWith("inventory:stats")
              )
            ) && <Route path="stats" element={<Stats />} />}
            {checkAccess("inventory:write") && (
              <>
                <Route path="items/add-item" element={<AddInventoryItem />} />
                <Route path="items/add-item/excel" element={<BulkAddView />} />
              </>
            )}
            <Route path="stats" element={<></>} />
            {checkAccess("inventory:write") && (
              <Route path="settings" element={<Settings />} />
            )}
          </Route>
        )}

        {checkAccessAnyOne(projectModulePermissions) && (
          <Route path="/project" element={<ProjectLayout />}>
            <Route
              index
              element={<Navigate to="/project/add" replace={true} />}
            />
            {checkAccess(permissions["/project/create"]) && (
              <Route path="add" element={<AddProject />} />
            )}
            {checkAccess(permissions["/project/list"]) && (
              <Route path="view-your" element={<YourProjects />} />
            )}
            {checkAccess(permissions["/project/list-all"]) && (
              <Route path="view-all" element={<AllProjects />} />
            )}
            {checkAccess(permissions["/project/edit-all"]) && (
              <Route path="edit-all" element={<EditProjects />} />
            )}
            {checkAccess(permissions["/project"]) && (
              <Route path="details/:id" element={<ProjectDetails />} />
            )}
          </Route>
        )}

        {checkAccessAnyOne(patentModulePermissions) && (
          <Route path="/patent" element={<PatentLayout />}>
            <Route
              index
              element={<Navigate to="/patent/add" replace={true} />}
            />
            {checkAccess(permissions["/patent/create"]) && (
              <Route path="add" element={<AddPatent />} />
            )}
            {checkAccess(permissions["/patent/list"]) && (
              <Route path="view-your" element={<YourPatents />} />
            )}
            {checkAccess(permissions["/patent/list-all"]) && (
              <Route path="view-all" element={<AllPatents />} />
            )}
            {checkAccess(permissions["/patent/edit-all"]) && (
              <Route path="edit-all" element={<EditPatents />} />
            )}

            {checkAccess(permissions["/patent"]) && (
              <Route path="details/:id" element={<PatentDetails />} />
            )}
          </Route>
        )}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Routing;
