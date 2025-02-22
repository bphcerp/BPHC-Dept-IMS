import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/Auth";
import { PersonIcon, ListBulletIcon } from "@radix-ui/react-icons";
import { CalendarClockIcon } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";
import { SidebarMenuGroup } from "@/components/AppSidebar";
const NotionalSupervisorLayout = () => {
  const { checkAccess } = useAuth();
  const items: SidebarMenuGroup[] = [];

  // Keeping it as admin for now, and will replace with other role(s) in the future
  if (checkAccess("admin")) {
    items.push({
      title: "Notional Supervisor",
      items: [
        {
          title: "Update Grade",
          icon: <PersonIcon />,
          url: "/phd/notional-supervisor/update-grade",
        },
      ],
    });

    items.push({
      title: "DRC Convenor",
      items: [
        {
          title: "Coursework Form",
          icon: <ListBulletIcon />,
          url: "/phd/drc-convenor/coursework-form",
        },
        {
          title: "Update Qualifying Exam Deadline",
          icon: <CalendarClockIcon />,
          url: "/phd/drc-convenor/update-qualifying-exam-deadline",
        },
      ],
    });

    items.push({
      title: "PhD Student",
      items: [
        {
          title: "Exam Form Deadline",
          icon: <PersonIcon />,
          url: "/phd/phd-student/form-deadline",
        },
      ],
    });
  }

  return items.length !== 0 ? (
    <>
      <AppSidebar items={items} />
      <Outlet />
    </>
  ) : (
    <Navigate to="/" />
  );
};

export default NotionalSupervisorLayout;
