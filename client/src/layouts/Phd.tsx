import { AppSidebar } from "@/components/AppSidebar";
import {
  ClipboardCheck,
  UserCheck,
  FileQuestion,
  FileSpreadsheet,
  Calendar,
  Clock,
  Mail,
  FileText,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { permissions } from "lib";

const NotionalSupervisorLayout = () => {
  const items = [
    {
      title: "Supervisor",
      items: [
        {
          title: "Proposal Management",
          icon: <FileText />,
          url: "/phd/supervisor/proposals",
          requiredPermissions: [
            permissions["/phd/proposal/supervisor/getProposals"],
          ],
        },
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
      title: "Co-Supervisor",
      items: [
        {
          title: "Proposal Management",
          icon: <FileText />,
          url: "/phd/coSupervisor/proposals",
          requiredPermissions: [
            permissions["/phd/proposal/coSupervisor/getProposals"],
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
          title: "Proposal Management",
          icon: <FileText />,
          url: "/phd/phd-student/proposals",
          requiredPermissions: [
            permissions["/phd/proposal/student/getProposals"],
          ],
        },
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
        {
          title: "Email Templates",
          icon: <Mail />,
          url: "/phd/staff/manage-email-templates",
          requiredPermissions: [permissions["/phd/staff/emailTemplates"]],
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
