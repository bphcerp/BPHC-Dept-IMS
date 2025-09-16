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
import PhdLayout from "@/layouts/Phd";
import { allPermissions, permissions } from "lib";
import ExaminerAssignments from "@/views/Phd/Examiner/Assignments";
import {
  BookOpen,
  Computer,
  FileText,
  GraduationCap,
  LibraryBig,
  Warehouse,
  File,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { Calendar } from "lucide-react";
import MeetingLayout from "@/layouts/MeetingLayout";
import MeetingDashboardView from "@/views/Meeting/MeetingDashboardView";
import CreateMeeting from "@/views/Meeting/CreateMeeting";
import ViewMeeting from "@/views/Meeting/ViewMeeting";
import RespondToInvite from "@/views/Meeting/RespondToInvite";
import UpdateSemesterDates from "@/views/Phd/Staff/UpdateSemesterDates";
import UpdateDeadlinesPage from "@/views/Phd/Staff/UpdateDeadlines";
import UpdateSubAreasPage from "@/views/Phd/Staff/UpdateSubAreas";
import ManageEmailTemplates from "@/views/Phd/Staff/ManageEmailTemplates";
import QualifyingExams from "@/views/Phd/Student/QualifyingExams";
import QualifyingExamManagement from "@/views/Phd/DrcConvenor/QualifyingExamManagement";
import DrcProposalManagement from "@/views/Phd/DrcConvenor/ProposalManagement";
import DrcViewProposal from "@/views/Phd/DrcConvenor/ViewProposal";
import DacProposalManagement from "@/views/Phd/DacMember/ProposalManagement";
import DacViewProposal from "@/views/Phd/DacMember/ViewProposal";
import ExaminerSuggestions from "@/views/Phd/Supervisor/ExaminerSuggestions";
import Proposal from "@/views/Phd/Student/Proposal";
import SupervisorProposal from "@/views/Phd/Supervisor/Proposal";
import SupervisorViewProposal from "@/views/Phd/Supervisor/ViewProposal";
import NotFoundPage from "@/layouts/404";
import ConferenceLayout from "@/layouts/Conference";
import ConferenceApplyView from "@/views/Conference/Apply";
import HandoutLayout from "@/layouts/Handouts";
import DCAMemberReviewForm from "@/views/Handouts/DCAReview";
import DCAConvenorHandouts from "@/views/Handouts/DCAConvenorHandouts";
import DCAMemberHandouts from "@/views/Handouts/DCAMemberHandouts";
import FacultyHandouts from "@/views/Handouts/FacultyHandouts";
import FacultyHandout from "@/views/Handouts/FacultyHandout";
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
import UploadReseargence from "@/views/Publications/UploadReseargence";
import InventoryLayout from "@/layouts/Inventory";
import Settings from "@/views/Inventory/Settings";
import { ItemsView } from "@/views/Inventory/ItemsView";
import AddInventoryItem from "@/views/Inventory/AddInventoryItem";
import BulkAddView from "@/views/Inventory/BulkAddView";
import Stats from "@/views/Inventory/Stats";
import ProfilePage from "@/views/Profile/ProfilePage";
import ContributorsPage from "@/views/Contributors";
import HelpPage from "@/views/Wiki";
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
import WilpLayout from "@/layouts/Wilp";
import AllWilpProjects from "@/views/Wilp/AllWilpProjects";
import YourWILPProjects from "@/views/Wilp/YourWilpProjects";
import BulkUploadWilp from "@/views/Wilp/BulkUploadWilp";
import WilpProjectDetails from "@/views/Wilp/[id]";
import Statistics from "@/views/Wilp/Stats";
import SendMail from "@/views/Wilp/SendMail";
import AnalyticsLayout from "@/layouts/Analytics";
import PublicationsAnalytics from "@/views/Analytics/Publications";

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
const qpReviewModulePermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("qp:")
);
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
const wilpModulePermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("wilp:")
);
const meetingModulePermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("meeting:")
);const analyticsModulePermissions: string[] = Object.keys(allPermissions).filter(
  (permission) => permission.startsWith("analytics:")
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
    {
      title: "WILP Projects",
      icon: <BookOpen />,
      url: "/wilp",
      requiredPermissions: wilpModulePermissions,
    },
    {
      title: "Meeting",
      icon: <Calendar />,
      url: "/meeting",
      requiredPermissions: meetingModulePermissions,
    },
    {
      title: "Analytics",
      icon: <ChartNoAxesCombined />,
      url: "/analytics",
      requiredPermissions: analyticsModulePermissions,
    },
  ];

  return (
    <BrowserRouter
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
                authState ? [{ title: "Modules", items: modules }] : []
              }
            />
          }
        />
        <Route path="/contributors" element={<ContributorsPage />} />
        <Route
          path="/help"
          element={authState ? <HelpPage /> : <Navigate to="/" replace />}
        />
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
        {checkAccessAnyOne(meetingModulePermissions) && (
          <Route path="/meeting" element={<MeetingLayout />}>
            <Route index element={<MeetingDashboardView />} />
            <Route path="create" element={<CreateMeeting />} />
            <Route path="view/:id" element={<ViewMeeting />} />
            <Route path="respond/:id" element={<RespondToInvite />} />
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
            {/* Staff */}
            {checkAccessAnyOne([
              permissions["/phd/staff/getAllSem"],
              permissions["/phd/staff/qualifyingExams"],
              permissions["/phd/staff/emailTemplates"],
            ]) && (
              <Route path="staff" element={<Outlet />}>
                {checkAccess(permissions["/phd/staff/getAllSem"]) && (
                  <Route
                    path="update-semester-dates"
                    element={<UpdateSemesterDates />}
                  />
                )}
                {checkAccess(permissions["/phd/staff/qualifyingExams"]) && (
                  <>
                    <Route
                      path="update-deadlines"
                      element={<UpdateDeadlinesPage />}
                    />
                    <Route
                      path="update-subareas"
                      element={<UpdateSubAreasPage />}
                    />
                  </>
                )}
                {checkAccess(permissions["/phd/staff/emailTemplates"]) && (
                  <Route
                    path="manage-email-templates"
                    element={<ManageEmailTemplates />}
                  />
                )}
              </Route>
            )}

            {/* Student */}
            {checkAccess(permissions["/phd/student/getQualifyingExams"]) && (
              <Route path="phd-student" element={<Outlet />}>
                <Route path="proposals" element={<Proposal />} />
                <Route path="qualifying-exams" element={<QualifyingExams />} />
              </Route>
            )}

            {checkAccessAnyOne([
              permissions["/phd/drcMember/getAvailableExams"],
              permissions["/phd/proposal/drcConvener/getProposals"],
            ]) && (
              <Route path="drc-convenor" element={<Outlet />}>
                {checkAccess(
                  permissions["/phd/drcMember/getAvailableExams"]
                ) && (
                  <Route
                    path="qualifying-exam-management"
                    element={<QualifyingExamManagement />}
                  />
                )}
                {checkAccess(
                  permissions["/phd/proposal/drcConvener/getProposals"]
                ) && (
                  <>
                    <Route
                      path="proposal-management"
                      element={<DrcProposalManagement />}
                    />
                    <Route
                      path="proposal-management/:id"
                      element={<DrcViewProposal />}
                    />
                  </>
                )}
              </Route>
            )}
            {checkAccess(
              permissions["/phd/proposal/dacMember/getProposals"]
            ) && (
              <Route path="dac" element={<Outlet />}>
                <Route path="proposals" element={<DacProposalManagement />} />
                <Route path="proposals/:id" element={<DacViewProposal />} />
              </Route>
            )}
            {checkAccessAnyOne([
              permissions["/phd/proposal/supervisor/getProposals"],
              permissions["/phd/supervisor/suggestExaminers"],
            ]) && (
              <Route path="supervisor" element={<Outlet />}>
                {checkAccess(
                  permissions["/phd/proposal/supervisor/getProposals"]
                ) && (
                  <>
                    <Route path="proposals" element={<SupervisorProposal />} />
                    <Route
                      path="proposal/:id"
                      element={<SupervisorViewProposal />}
                    />
                  </>
                )}
                {checkAccess(
                  permissions["/phd/supervisor/suggestExaminers"]
                ) && (
                  <Route
                    path="examiner-suggestions"
                    element={<ExaminerSuggestions />}
                  />
                )}
              </Route>
            )}
            {checkAccess(permissions["/phd/examiner/assignments"]) && (
              <Route path="examiner" element={<Outlet />}>
                <Route path="assignments" element={<ExaminerAssignments />} />
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
            {checkAccess(permissions["/publications/upload"]) && (
              <Route
                path="upload-researgence"
                element={<UploadReseargence />}
              />
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
        {checkAccessAnyOne(wilpModulePermissions) && (
          <Route path="/wilp" element={<WilpLayout />}>
            <Route
              index
              element={<Navigate to="/wilp/view-all" replace={true} />}
            />
            {checkAccess(permissions["/wilpProject/view/all"]) && (
              <Route path="view-all" element={<AllWilpProjects />} />
            )}
            {checkAccess(permissions["/wilpProject/view/all"]) && (
              <Route path="view-your" element={<YourWILPProjects />} />
            )}
            {checkAccess(permissions["/wilpProject/upload"]) && (
              <Route
                path="bulk-upload"
                element={
                  <BulkUploadWilp onBack={() => window.history.back()} />
                }
              />
            )}
            {checkAccess(permissions["/wilpProject/mail"]) && (
              <Route path="send-mail" element={<SendMail />} />
            )}
            {checkAccess(permissions["/wilpProject/stats"]) && (
              <Route path="view-stats" element={<Statistics />} />
            )}
            <Route path=":id" element={<WilpProjectDetails />} />
          </Route>
        )}
        {checkAccessAnyOne(analyticsModulePermissions) && (
          <Route path="/analytics" element={<AnalyticsLayout />}>
            <Route
              index
              element={<Navigate to="/analytics/publications" replace={true} />}
            />
            {checkAccess(permissions["/analytics/publications"]) && (
              <>
                <Route
                  path="publications"
                  element={<PublicationsAnalytics />}
                />
              </>
            )}
          </Route>
        )}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
export default Routing;
