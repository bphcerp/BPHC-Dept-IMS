import { AppSidebar } from "@/components/AppSidebar";
import { PersonIcon } from "@radix-ui/react-icons";
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
              },
              {
                title: "Roles",
                icon: <PersonIcon />,
                url: "/admin/roles",
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
