import { AppSidebar } from "@/components/AppSidebar";
import { Plus, FileText } from "lucide-react";
import { Outlet } from "react-router-dom";
import { permissions } from "lib";

const WilpLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "WILP Projects",
            items: [
              {
                title: "Add Project",
                icon: <Plus />,
                url: "/wilp/add",
                requiredPermissions: [permissions["/wilp/project/create"]],
              },
              {
                title: "Your Projects",
                icon: <FileText />,
                url: "/wilp/view-your",
                requiredPermissions: [permissions["/wilp/project/view-selected"]],
              },
              {
                title: "All Projects",
                icon: <FileText />,
                url: "/wilp/view-all",
                requiredPermissions: [permissions["/wilp/project/view-all"]],
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default WilpLayout; 