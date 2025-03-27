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
            title: "Admin",
            items: [
              {
                title: "Apply",
                icon: <FileText />,
                url: "/conference/apply",
                requiredPermissions: [
                  permissions["/conference/createApplication"],
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
