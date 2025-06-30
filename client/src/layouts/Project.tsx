import { AppSidebar } from "@/components/AppSidebar";
import { permissions } from "lib";
import { FileText, Plus } from "lucide-react";
import { Outlet } from "react-router-dom";

const ProjectLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Projects",
            items: [
              {
                title: "Add Project",
                icon: <Plus />,
                url: "/project/add",
                requiredPermissions: [permissions["/project/create"]],
              },
              {
                title: "View Projects",
                icon: <FileText />,
                url: "/project/view",
                requiredPermissions: [permissions["/project/list"]],
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default ProjectLayout; 