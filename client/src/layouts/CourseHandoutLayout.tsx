import { AppSidebar } from "@/components/AppSidebar";
import { BookLockIcon, BookOpen } from "lucide-react";
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
              {
                title: "DCA Member View", 
                icon: <BookLockIcon/>,
                url: "/handouts/DCA",
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