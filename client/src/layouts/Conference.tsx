import { AppSidebar } from "@/components/AppSidebar";
import { permissions } from "lib";
import { FileText } from "lucide-react";
import { Outlet } from "react-router-dom";

const ConferenceLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Faculty",
            items: [
              {
                title: "Apply",
                icon: <FileText />,
                url: "/conference/apply",
                requiredPermissions: [
                  permissions["/conference/createApplication"],
                ],
              },
              {
                title: "Submitted Applications",
                icon: <FileText />,
                url: "/conference/submitted",
                requiredPermissions: [
                  permissions["/conference/applications/my"],
                ],
              },
            ],
          },
          {
            title: "Review",
            items: [
              {
                title: "Pending Applications",
                icon: <FileText />,
                url: "/conference/pending",
                requiredPermissions: [
                  permissions["/conference/applications/pending"],
                ],
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default ConferenceLayout;
