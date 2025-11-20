import { AppSidebar } from "@/components/AppSidebar";
import { Briefcase } from "lucide-react";
import { permissions } from "lib";
import { Outlet } from "react-router-dom";

const FacultyContributionLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Faculty Institute Contribution",
            items: [
              {
                title: "Submit Contribution",
                icon: <Briefcase />,
                url: "/contribution/submit",
                requiredPermissions: ["contribution:submit"],
              },
              {
                title: "Review Contributions",
                icon: <Briefcase />,
                url: "/contribution/review",
                requiredPermissions: ["contribution:review"],
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default FacultyContributionLayout;