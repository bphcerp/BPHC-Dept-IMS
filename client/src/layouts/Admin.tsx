import { AppSidebar } from "@/components/AppSidebar";
import { PersonIcon } from "@radix-ui/react-icons";
import { permissions } from "lib";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Admin",
            items: [
              {
                title: "Members",
                icon: <PersonIcon />,
                url: "/admin/members",
                requiredPermissions: [permissions["/admin/member/details"]],
              },
              {
                title: "Roles",
                icon: <PersonIcon />,
                url: "/admin/roles",
                requiredPermissions: [permissions["/admin/role"]],
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default AdminLayout;
