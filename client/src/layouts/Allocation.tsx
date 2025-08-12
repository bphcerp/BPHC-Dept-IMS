import { AppSidebar } from "@/components/AppSidebar";
import { ClockArrowDownIcon, SquareStackIcon, UserRoundIcon } from "lucide-react";
import { Outlet } from "react-router-dom";

const AllocationLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Course Allocation",
            items: [
              {
                title: "Ongoing Allocation",
                icon: <ClockArrowDownIcon />,
                url: "/allocation/ongoing",
                requiredPermissions: ["allocation:write"]
              },
              {
                title: "Archive",
                icon: <SquareStackIcon />,
                url: "/allocation/history",
                requiredPermissions: ["allocation:data:history"],
              },
              {
                title: "Your Allocations",
                icon: <UserRoundIcon />,
                url: "/allocation/personal",
              },
            ],
          },
        ]}
      />
      <div className="w-full overflow-y-auto">
        <Outlet />
      </div>
    </>
  );
};

export default AllocationLayout;
