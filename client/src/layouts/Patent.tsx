import { AppSidebar } from "@/components/AppSidebar";
import { permissions } from "lib";
import { FileText, Plus } from "lucide-react";
import { Outlet } from "react-router-dom";

const PatentLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Patents",
            items: [
              {
                title: "Add Patent",
                icon: <Plus />,
                url: "/patent/add",
                requiredPermissions: [permissions["/patent/create"]],
              },
              {
                title: "Your Patents",
                icon: <FileText />,
                url: "/patent/view-your",
                requiredPermissions: [permissions["/patent/list"]],
              },
              {
                title: "All Patents",
                icon: <FileText />,
                url: "/patent/view-all",
                requiredPermissions: [permissions["/patent/list-all"]],
              },
              {
                title: "Edit Patents",
                icon: <FileText />,
                url: "/patent/edit-all",
                requiredPermissions: [permissions["/patent/edit-all"]],
              },

            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default PatentLayout; 