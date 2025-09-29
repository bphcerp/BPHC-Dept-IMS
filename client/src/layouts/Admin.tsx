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
              {
                title: "Testing",
                icon: <PersonIcon />,
                url: "/admin/testing",
                requiredPermissions: [permissions["/admin/testing"]],
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
