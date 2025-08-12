import { AppSidebar } from "@/components/AppSidebar";
import { ClockArrowDownIcon, MessageSquareReplyIcon, SendIcon, SquareStackIcon, UserRoundIcon } from "lucide-react";
import { Outlet } from "react-router-dom";

const AllocationLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          // This section should be visible to all users with allocation write permissions
          {
            title: 'Admin Control',
            items: [
              {
                title: "Overview",
                icon: <ClockArrowDownIcon />,
                url: "/allocation/ongoing",
                requiredPermissions: ["allocation:write"]
              },
              {
                title: "Responses",
                icon: <MessageSquareReplyIcon />,
                url: "/allocation/responses",
                requiredPermissions: ["allocation:write"]
              },
              {
                title: "Archive",
                icon: <SquareStackIcon />,
                url: "/allocation/archive",
                requiredPermissions: ["allocation:data:history"],
              }
            ]
          },
          {
            title: "Course Allocation",
            items: [
              {
                title: "Your Allocations",
                icon: <UserRoundIcon />,
                url: "/allocation/personal",
              },
              {
                title: "Submit Your Preferences",
                icon: <SendIcon />,
                url: "/allocation/submit",
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
