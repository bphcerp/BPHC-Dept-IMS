import { AppSidebar } from "@/components/AppSidebar";
import { FileUp, PenTool, Users, History } from "lucide-react";
import { Outlet } from "react-router-dom";

const SigningLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Sign Documents",
            items: [
              {
                title: "Dashboard",
                icon: <PenTool />,
                url: "/signing/dashboard",
              },
              {
                title: "Upload Document",
                icon: <FileUp />,
                url: "/signing/upload",
                requiredPermissions: ["signing:upload"],
              },
              {
                title: "My Documents",
                icon: <History />,
                url: "/signing/my-documents",
              },
              {
                title: "Pending Signatures",
                icon: <Users />,
                url: "/signing/pending",
              },
            ],
          },
        ]}
      />
      <div className="w-full overflow-y-auto h-screen">
        <Outlet />
      </div>
    </>
  );
};

export default SigningLayout;
