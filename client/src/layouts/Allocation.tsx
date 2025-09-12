import { AppSidebar } from "@/components/AppSidebar";
import { ClockArrowDownIcon, DatabaseIcon, FileTextIcon, MessageSquareReplyIcon, SendIcon, Square, SquareStackIcon, UserRoundIcon } from "lucide-react";
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
                title: "Courses",
                icon: <DatabaseIcon />,
                url: "/allocation/courses",
                requiredPermissions: ["allocation:courses:write"]
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
                requiredPermissions: ["allocation:view"]
              },
              {
                title: "Submit Your Preferences",
                icon: <SendIcon />,
                url: "/allocation/submit",
                requiredPermissions: ["allocation:form:view"]
              },
            ],
          },
          {
            title: "Forms",
            items: [
              {
                title: "Form Templates",
                icon: <FileTextIcon />,
                url: "/allocation/form-templates",
                requiredPermissions: ["allocation:write"]
              },
              
            ]
          }
        ]}
      />
      <div className="w-full overflow-y-auto">
        <Outlet />
      </div>
    </>
  );
};

export default AllocationLayout;
