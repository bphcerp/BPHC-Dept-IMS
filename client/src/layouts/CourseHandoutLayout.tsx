import { AppSidebar } from "@/components/AppSidebar";
import { BookOpen } from "lucide-react";
import { Outlet } from "react-router-dom";

const CourseHandoutLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Course Handouts", 
            items: [
              {
                title: "Faculty View", 
                icon: <BookOpen />,
                url: "/handouts/faculty",
              },
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default CourseHandoutLayout;