import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { BookAudio } from "lucide-react";

const HandoutLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Handouts",
            items: [
              {
                title: "DCA Review",
                icon: <BookAudio />,
                url: "/handout/review",
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
