import { AppSidebar } from "@/components/AppSidebar";
import { Search } from "lucide-react";
import { Outlet } from "react-router-dom";

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
            ],
          },
        ]}
      />
      <Outlet />
    </>
  );
};

export default PublicationsLayout;
