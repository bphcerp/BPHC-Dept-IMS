import { AppSidebar } from "@/components/AppSidebar";
import { FileText, FileSpreadsheet, Mail } from "lucide-react";
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
                title: "Bulk Upload",
                icon: <FileSpreadsheet />,
                url: "/wilp/bulk-upload",
                requiredPermissions: [permissions["/wilpProject/upload"]],
              },
              {
                title: "Your Projects",
                icon: <FileText />,
                url: "/wilp/view-your",
                requiredPermissions: [permissions["/wilpProject/view/selected"]],
              },
              {
                title: "All Projects",
                icon: <FileText />,
                url: "/wilp/view-all",
                requiredPermissions: [permissions["/wilpProject/view/all"]],
              },
              {
                title: "Send Email",
                icon: <Mail />,
                url: "/wilp/send-mail",
                requiredPermissions: [permissions["/wilpProject/mail"]],
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