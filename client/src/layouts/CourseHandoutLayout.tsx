import { AppSidebar } from "@/components/AppSidebar";
import { BookLockIcon, BookOpen,GraduationCap} from "lucide-react";
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
              {
                title: "HOD View",
                icon: <GraduationCap />,
                url: "/handouts/HOD",
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