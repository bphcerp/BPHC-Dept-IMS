import { AppSidebar } from "@/components/AppSidebar";
import { FileText } from "lucide-react";
import { Outlet } from "react-router-dom";

const HandoutLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Course Handouts",
            items: [
              {
                title: "Faculty Submission",
                icon: <FileText />,
                url: "/handouts/createapplication",
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default HandoutLayout;
