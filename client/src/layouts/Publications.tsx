import { AppSidebar } from "@/components/AppSidebar";
import { Search, Upload } from "lucide-react";
import { Outlet } from "react-router-dom";
import { permissions } from "lib";
import { Pencil } from "lucide-react";
const PublicationsLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Publications",
            items: [
              {
                title: "View Your Publications",
                icon: <Search />,
                url: "/publications/your-publications",
              },
              {
                title: "View All Publications",
                icon: <Search />,
                url: "/publications/all-publications",
                requiredPermissions: [permissions["/publications/all"]],
              },
              {
                title: "Upload Researgence Data",
                icon: <Upload />,
                url: "/publications/upload-researgence",
                requiredPermissions: [permissions["/publications/upload"]],
              },
              {
                title: "Edit All Publications",
                icon: <Pencil />,
                url: "/publications/edit-publications",
                requiredPermissions: [permissions["/publications/all"]],
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default PublicationsLayout;
