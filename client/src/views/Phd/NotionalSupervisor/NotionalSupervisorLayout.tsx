import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/Auth";
import { PersonIcon } from "@radix-ui/react-icons";
import { Navigate, Outlet } from "react-router-dom";
const NotionalSupervisorLayout = () => {
  const { checkAccess } = useAuth();
  return checkAccess("admin") ? (
    <>
      <AppSidebar
        items={[
          {
            title: "Notional Supervisor",
            items: [
              {
                title: "Update Grade",
                icon: <PersonIcon />,
                url: "/phd/notionalsupervisor/updategrade",
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

export default NotionalSupervisorLayout;
