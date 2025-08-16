import { AppSidebar } from "@/components/AppSidebar";
import {
  ClipboardCheck,
  UserCheck,
  FileQuestion,
  FileSpreadsheet,
  Calendar,
  Clock,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { permissions } from "lib";

const NotionalSupervisorLayout = () => {
  const items = [
    {
      title: "Supervisor",
      items: [
        {
          title: "Examiner Management",
          icon: <UserCheck />,
          url: "/phd/supervisor/examiner-suggestions",
          requiredPermissions: [
            permissions["/phd/notionalSupervisor/updateSuggestedExaminer"],
          ],
        },
      ],
    },
    {
      title: "DRC Convenor",
      items: [
        {
          title: "Qualifying Exam Management",
          icon: <FileQuestion />,
          url: "/phd/drc-convenor/qualifying-exam-management",
          requiredPermissions: [
            permissions["/phd/drcMember/getAvailableExams"],
          ],
        },
      ],
    },
    {
      title: "PhD Scholar",
      items: [
        {
          title: "Qualifying Exam Management",
          icon: <ClipboardCheck />,
          url: "/phd/phd-student/qualifying-exams",
          requiredPermissions: [
            permissions["/phd/student/getQualifyingExamStatus"],
          ],
        },
      ],
    },
    {
      title: "Staff",
      items: [
        {
          title: "Semester Dates Management",
          icon: <Calendar />,
          url: "/phd/staff/update-semester-dates",
          requiredPermissions: [permissions["/phd/staff/getAllSem"]],
        },
        {
          title: "Deadline Management",
          icon: <Clock />,
          url: "/phd/staff/update-deadlines",
          requiredPermissions: [permissions["/phd/staff/qualifyingExams"]],
        },
        {
          title: "Sub Areas Management",
          icon: <FileSpreadsheet />,
          url: "/phd/staff/update-subareas",
          requiredPermissions: [
            permissions["/phd/staff/updateSubAreas"],
            permissions["/phd/staff/deleteSubArea"],
          ],
        },
      ],
    },
  ];

  return (
    <>
      <AppSidebar items={items} />
      <Outlet />
    </>
  );
};

export default NotionalSupervisorLayout;
