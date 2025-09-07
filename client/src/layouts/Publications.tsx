import { AppSidebar } from "@/components/AppSidebar";
import { Search, Upload } from "lucide-react";
import { Outlet } from "react-router-dom";
import { permissions } from "lib";
import { Pencil } from "lucide-react";

const PublicationsLayout = () => {
  return (
    <div className="flex h-screen w-screen">
      {/* Sidebar */}
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

      {/* Main content area (fills rest of viewport) */}
      <div className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default PublicationsLayout;
