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
                title: "Faculty", 
                icon: <BookOpen />,
                url: "/handouts/faculty",
              },
              {
                title: "DCA Member", 
                icon: <BookLockIcon/>,
                url: "/handouts/DCA",
              },
              {
                title: "HOD",
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