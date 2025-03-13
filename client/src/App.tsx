import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/views/Home";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/Auth";
import { GOOGLE_CLIENT_ID } from "@/lib/constants";
import { SidebarProvider } from "@/components/ui/sidebar";
import ProtectedLayout from "@/layouts/Protected";
import Admin from "@/views/Admin";
import AdminLayout from "@/layouts/Admin";
import MembersView from "@/views/Admin/Members";
import MemberDetailsView from "./views/Admin/Members/[member]";
import FormDeadline from "./views/Phd/Student/FormDeadline";
import RoleDetailsView from "./views/Admin/Roles/[role]";
import { Toaster } from "./components/ui/sonner";
import RolesView from "./views/Admin/Roles";
import Phd from "@/views/Phd";
import NotionalSupervisorLayout from "./layouts/Phd/NotionalSupervisor";
import DrcConvenorLayout from "./layouts/Phd/DrcConvenor";
import PhDStudentLayout from "./layouts/Phd/Student";
import UpdateGrade from "./views/Phd/NotionalSupervisor/UpdateGrade";
import PhdLayout from "./layouts/Phd/Phd";
import CourseworkForm from "./views/Phd/DrcConvenor/CourseworkForm";
import UpdateQualifyingExamDeadline from "./views/Phd/DrcConvenor/UpdateQualifyingExamDeadline";
import GenerateQualifyingExamForm from "./views/Phd/DrcConvenor/GenerateQualifyingExamForm";
import PhdThatAppliedForQualifyingExam from "./views/Phd/DrcConvenor/PhdThatAppliedForQualifyingExam";
import UpdateQualifyingExamResultsOfAllStudents from "./views/Phd/DrcConvenor/UpdateQualifyingExamResultsOfAllStudents";
import UpdateQualifyingExamPassingDates from "./views/Phd/DrcConvenor/UpdateQualifyingExamPassingDates";
import UpdateProposalDeadline from "./views/Phd/DrcConvenor/UpdateProposalDeadline";
import AssignDacMembers from "./views/Phd/DrcConvenor/AssignDacMemberes";
import QualifyingExamStatus from "./views/Phd/Student/QualifyingExamStatus";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <BrowserRouter
            // react-router future version flags, prevents console warnings
            future={{
              v7_relativeSplatPath: true,
              v7_startTransition: true,
            }}
          >
            <SidebarProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                {/* Protected Routes (requires authentication) */}
                <Route path="/" element={<ProtectedLayout />}>
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<Admin />} />
                    <Route path="members" element={<MembersView />} />
                    <Route
                      path="members/:member"
                      element={<MemberDetailsView />}
                    />
                    <Route path="roles" element={<RolesView />} />
                    <Route path="roles/:role" element={<RoleDetailsView />} />
                  </Route>

                  <Route path="phd" element={<PhdLayout />}>
                    <Route index element={<Phd />} />
                    <Route
                      path="notional-supervisor"
                      element={<NotionalSupervisorLayout />}
                    >
                      <Route path="update-grade" element={<UpdateGrade />} />
                    </Route>
                    <Route path="drc-convenor" element={<DrcConvenorLayout />}>
                      <Route
                        path="coursework-form"
                        element={<CourseworkForm />}
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
                    <Route path="phd-student" element={<PhDStudentLayout />}>
                      <Route path="form-deadline" element={<FormDeadline />} />
                      <Route path="exam-status" element={<QualifyingExamStatus />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </SidebarProvider>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
