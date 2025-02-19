import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/Auth";
import { PersonIcon } from "@radix-ui/react-icons";
import { Navigate, Outlet } from "react-router-dom";
import { SidebarMenuGroup } from "@/components/AppSidebar";
const NotionalSupervisorLayout = () => {
  const { checkAccess } = useAuth();
  const items: SidebarMenuGroup[] = [];

  // Keeping it as admin for now, and will replace with other role(s) in the future
  if (checkAccess("admin")) {
    items.push({
      title: "Notional Supervisor",
      items: [
        {
          title: "Update Grade",
          icon: <PersonIcon />,
          url: "/phd/notional-supervisor/update-grade",
        },
      ],
    });
  }

  return items.length !== 0 ? (
    <>
      <AppSidebar items={items} />
      <Outlet />
    </>
  ) : (
    <Navigate to="/" />
  );
};

export default NotionalSupervisorLayout;
