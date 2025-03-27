import { AppSidebar } from "@/components/AppSidebar";
import { ReaderIcon } from "@radix-ui/react-icons";
import { permissions } from "lib";
import { Outlet } from "react-router-dom";

const HandoutLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Faculty",
            items: [
              {
                title: "Handouts",
                icon: <ReaderIcon />,
                url: "/handout/faculty",
                requiredPermissions: [permissions["/handout/faculty/get"]],
              },
            ],
          },
          {
            title: "DCAMember",
            items: [
              {
                title: "Handouts",
                icon: <ReaderIcon />,
                url: "/handout/dca",
                requiredPermissions: [permissions["/handout/dca/get"]],
              },
            ],
          },
          {
            title: "DCA Convenor",
            items: [
              {
                title: "Handouts",
                icon: <ReaderIcon />,
                url: "/handout/dcaconvenor",
                requiredPermissions: [
                  permissions["/handout/dca/get"],
                  permissions["/handout/dca/assignReviewer"],
                ],
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
