import { AppSidebar } from "@/components/AppSidebar";
import { InviteDialog } from "@/components/InviteDialog";
import { SidebarProvider} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/Auth";
import { Navigate, Outlet } from "react-router-dom";

const AdminLayout = () => {
  const { checkAccess } = useAuth();
  // Only allow access to the admin layout if the user has the "admin" permission
  return checkAccess("admin") ? (
    <div>
      <div className="absolute right-5 top-5">
        <InviteDialog />
      </div>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
      <main>
        <Outlet />
      </main>
    </div>
  ) : (
    <Navigate to="/" />
  );
};

export default AdminLayout;
