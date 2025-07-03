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
                title: "Your Projects",
                icon: <FileText />,
                url: "/project/view-your",
                requiredPermissions: [permissions["/project/list"]],
              },
              {
                title: "All Projects",
                icon: <FileText />,
                url: "/project/view-all",
                requiredPermissions: [permissions["/project/list-all"]],
              },
              {
                title: "Edit Projects",
                icon: <FileText />,
                url: "/project/edit-all",
                requiredPermissions: [permissions["/project/edit-all"]],
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