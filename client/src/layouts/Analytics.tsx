import { AppSidebar } from "@/components/AppSidebar";
import { LibraryBig } from "lucide-react";
import { Outlet } from "react-router-dom";
import { permissions } from "lib";

const AnalyticsLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Analytics",
            items: [
              {
                title: "Publications",
                icon: <LibraryBig />,
                url: "/analytics/publications",
                requiredPermissions: [permissions["/analytics/publications"]],
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default AnalyticsLayout;
