import { AppSidebar } from "@/components/AppSidebar";
import {
  CalendarClockIcon,
  List,
  Users,
  CaseUpper,
  NotepadText,
  CalendarX2,
  UserRoundPlus,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { permissions } from "lib";

const NotionalSupervisorLayout = () => {
  const items = [
    {
      title: "Supervisor",
      items: [
        {
          title: "Notional Supervisor Management",
          icon: <CaseUpper />,
          url: "/phd/notional-supervisor/update-grade",
          requiredPermissions: [permissions["/phd/supervisor/updateSuggestedExaminer"]],
        },
        {
          title: "Examiner Management",
          icon: <UserRoundPlus />,
          url: "/phd/notional-supervisor/suggest-examiner",
          requiredPermissions: [permissions["/phd/notionalSupervisor/updateCourseGrade"]],
        },
        {
          title: "Supervisor Mangement",
          icon: <Users />,
          url: "/phd/phd-supervisor/supervised-students",
          requiredPermissions: [permissions["/phd/supervisor/getSupervisedStudents"]],
        },
        {
          title: "Co-Supervisor Mannagement",
          icon: <Users />,
          url: "/phd/phd-co-supervisor/co-supervised-students",
          requiredPermissions: [permissions["/phd/coSupervisor/getCoSupervisedStudents"]],
        },
      ],
    },
    {
      title: "DRC Convenor",
      items: [
        {
          title: "Coursework Mangement",
          icon: <List />,
          url: "/phd/drc-convenor/coursework-form",
          requiredPermissions: [
            permissions["/phd/drcMember/generateCourseworkForm"],
          ],
        },
        {
          title: "Qualifying Exam Management",
          icon: <NotepadText />,
          url: "/phd/drc-convenor/qualifying-exam-management",
          requiredPermissions: [
            permissions["/phd/drcMember/getPhdDataOfWhoFilledApplicationForm"],
          ],
        },
        {
          title: "Proposal Management",
          icon: <UserRoundPlus />,
          url: "/phd/drc-convenor/assign-dac-members",
          requiredPermissions: [permissions["/phd/drcMember/updateFinalDac"]],
        },
      ],
    },
    {
      title: "PhD Student",
      items: [
        {
          title: "Qualifying Exam Manegement",
          icon: <CalendarClockIcon />,
          url: "/phd/phd-student/form-deadline",
          requiredPermissions: [permissions["/phd/student/checkExamStatus"]],
        },
        
        {
          title: "Proposal Management",
          icon: <NotepadText />,
          url: "/phd/phd-student/proposal-submission",
          requiredPermissions: [permissions["/phd/student/checkExamStatus"]],
        },
      ],
    },
    {
      title: "Staff",
      items: [
        {
          title: "Semester Dates Management",
          icon: <CalendarX2 />,
          url: "/phd/staff/update-semester-dates",
          requiredPermissions: [
            permissions["/phd/staff/getAllSem"],
          ],
        },
        {
          title: "Deadline Mangement",
          icon: <CalendarClockIcon />,
          url: "/phd/staff/update-deadlines",
          requiredPermissions: [permissions["/phd/staff/updateQualifyingExamDeadline"], permissions["/phd/staff/updateProposalDeadline"]],
        },
        {
          title: "Sub Areas Mangement",
          icon: <CalendarClockIcon />,
          url: "/phd/staff/update-subareas",
          requiredPermissions: [permissions["/phd/staff/updateSubAreas"], permissions["/phd/staff/getSubAreas"], permissions["/phd/staff/deleteSubArea"]],
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
