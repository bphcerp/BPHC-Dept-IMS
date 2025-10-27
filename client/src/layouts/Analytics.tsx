import { AppSidebar } from "@/components/AppSidebar";
import { LibraryBig, Presentation } from "lucide-react";
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
              {
                title: "Publications Multi-graph",
                icon: <LibraryBig />,
                url: "/analytics/publications2",
                requiredPermissions: [permissions["/analytics/publications"]],
              },
            ],
          },
          {
            title: "Create Slides",
            items: [
              {
                title: "Generate Presentation",
                icon: <Presentation />,
                url: "/analytics/presentation",
                requiredPermissions: [permissions["/analytics/publications"]],
              }
            ]
          }
        ]}
      />
      <Outlet />
    </>
  );
};

export default AnalyticsLayout;
