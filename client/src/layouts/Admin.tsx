import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/Auth";
import { PersonIcon } from "@radix-ui/react-icons";
import { Navigate, Outlet } from "react-router-dom";

const AdminLayout = () => {
  const { checkAccess } = useAuth();
  // Only allow access to the admin layout if the user has the "admin" permission
  return checkAccess("admin") ? (
    <>
      <AppSidebar
        items={[
          {
            title: "Admin",
            items: [
              {
                title: "Roles",
                icon: <PersonIcon />,
                url: "/admin/roles",
              },
              {
                title: "Members",
                icon: <PersonIcon />,
                url: "/admin/members",
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  ) : (
    <Navigate to="/" />
  );
};

export default AdminLayout;
