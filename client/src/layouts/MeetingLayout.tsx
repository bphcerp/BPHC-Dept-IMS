// client/src/layouts/MeetingLayout.tsx
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Calendar } from "lucide-react";

const MeetingLayout = () => {
  // This assumes you have a way to check permissions for the module
  const items = [
    {
      title: "Meetings",
      items: [
        {
          title: "Dashboard",
          icon: <Calendar />,
          url: "/meeting",
          // requiredPermissions: ['meeting:view'] // Example permission
        },
        // You can add more links here if needed
      ],
    },
  ];

  return (
    <>
      <AppSidebar items={items} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </div>
    </>
  );
};

export default MeetingLayout;
