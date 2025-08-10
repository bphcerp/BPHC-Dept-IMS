import { AppSidebar } from "@/components/AppSidebar";
import {
  ClipboardCheck,
  UserCheck,
  Users,
  FileText,
  UserPlus,
  UserCog,
  Presentation,
  UserCircle,
  FileQuestion,
  FileSpreadsheet,
  Calendar,
  Clock,
  BookOpen,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { permissions } from "lib";

const NotionalSupervisorLayout = () => {
  const items = [
    {
      title: "Supervisor",
      items: [
        {
          title: "Grades Management",
          icon: <UserCog />,
          url: "/phd/notional-supervisor/update-grade",
          requiredPermissions: [
            permissions["/phd/supervisor/updateSuggestedExaminer"],
          ],
        },
        {
          title: "Examiner Management",
          icon: <UserCheck />,
          url: "/phd/notional-supervisor/suggest-examiner",
          requiredPermissions: [
            permissions["/phd/notionalSupervisor/updateCourseGrade"],
          ],
        },
        {
          title: "Supervisor Management",
          icon: <UserPlus />,
          url: "/phd/phd-supervisor/supervised-students",
          requiredPermissions: [
            permissions["/phd/supervisor/getSupervisedStudents"],
          ],
        },
        {
          title: "Co-Supervisor Management",
          icon: <Users />,
          url: "/phd/phd-co-supervisor/co-supervised-students",
          requiredPermissions: [
            permissions["/phd/coSupervisor/getCoSupervisedStudents"],
          ],
        },
      ],
    },
    {
      title: "DRC Convenor",
      items: [
        {
          title: "Coursework Management",
          icon: <BookOpen />,
          url: "/phd/drc-convenor/coursework-form",
          requiredPermissions: [
            permissions["/phd/drcMember/generateCourseworkForm"],
          ],
        },
        {
          title: "Qualifying Exam Management",
          icon: <FileQuestion />,
          url: "/phd/drc-convenor/qualifying-exam-management",
          requiredPermissions: [
            permissions["/phd/drcMember/getPhdDataOfWhoFilledApplicationForm"],
          ],
        },
        {
          title: "Proposal Management",
          icon: <Presentation />,
          url: "/phd/drc-convenor/assign-dac-members",
          requiredPermissions: [permissions["/phd/drcMember/updateFinalDac"]],
        },
      ],
    },
    {
      title: "PhD Scholar",
      items: [
        {
          title: "My Profile",
          icon: <UserCircle />,
          url: "/phd/phd-student/my-profile",
          requiredPermissions: [permissions["/phd/student/checkExamStatus"]],
        },
        {
          title: "Qualifying Exam Management",
          icon: <ClipboardCheck />,
          url: "/phd/phd-student/qualifying-exams",
          requiredPermissions: [permissions["/phd/student/getQualifyingExamStatus"]],
        },

        {
          title: "Proposal Management",
          icon: <FileText />,
          url: "/phd/phd-student/proposal-submission",
          requiredPermissions: [permissions["/phd/student/checkExamStatus"]],
        }
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
          requiredPermissions: [
            permissions["/phd/staff/updateQualifyingExamDeadline"],
            permissions["/phd/staff/updateProposalDeadline"],
          ],
        },
        {
          title: "Sub Areas Management",
          icon: <FileSpreadsheet />,
          url: "/phd/staff/update-subareas",
          requiredPermissions: [
            permissions["/phd/staff/updateSubAreas"],
            permissions["/phd/staff/getSubAreas"],
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
