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
  Users,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { permissions } from "lib";

const PhdLayout = () => {
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
            permissions["/phd/supervisor/suggestExaminers"],
          ],
        },
      ],
    },

    {
      title: "DAC Member",
      items: [
        {
          title: "Proposal Evaluation",
          icon: <Users />,
          url: "/phd/dac/proposals",
          requiredPermissions: [
            permissions["/phd/proposal/dacMember/getProposals"],
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
        {
          title: "Proposal Management",
          icon: <FileText />,
          url: "/phd/drc-convenor/proposal-management",
          requiredPermissions: [
            permissions["/phd/proposal/drcConvener/getProposals"],
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
            permissions["/phd/staff/insertSubArea"],
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
    {
      title: "Examiner",
      items: [
        {
          title: "Assignments",
          icon: <ClipboardCheck />,
          url: "/phd/examiner/assignments",
          requiredPermissions: [permissions["/phd/examiner/assignments"]],
        },
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

export default PhdLayout;
