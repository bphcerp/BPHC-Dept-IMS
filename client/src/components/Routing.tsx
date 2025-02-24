import { useAuth } from "@/hooks/Auth";
import AdminLayout from "@/layouts/Admin";
import Admin from "@/views/Admin";
import MembersView from "@/views/Admin/Members";
import MemberDetailsView from "@/views/Admin/Members/[member]";
import RolesView from "@/views/Admin/Roles";
import RoleDetailsView from "@/views/Admin/Roles/[role]";
import Home from "@/views/Home";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const Routing = () => {
  const { authState, checkAccess } = useAuth();

  return (
    <BrowserRouter
      // react-router future version flags, prevents console warnings
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Home />} />

        {authState && (
          <>
            {checkAccess("admin:frontend") && (
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Admin />} />
                <Route path="members" element={<MembersView />} />
                <Route path="members/:member" element={<MemberDetailsView />} />
                <Route path="roles" element={<RolesView />} />
                <Route path="roles/:role" element={<RoleDetailsView />} />
              </Route>
            )}
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default Routing;
