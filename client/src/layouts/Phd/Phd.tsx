import { AppSidebar } from "@/components/AppSidebar";
import {
  CalendarClockIcon,
  FileCheck,
  CalendarCheck2,
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
      title: "Notional Supervisor",
      items: [
        {
          title: "Update Grade",
          icon: <CaseUpper />,
          url: "/phd/notional-supervisor/update-grade",
        },
      ],
    },
    {
      title: "DRC Convenor",
      items: [
        {
          title: "Coursework Form",
          icon: <List />,
          url: "/phd/drc-convenor/coursework-form",
          requiredPermissions: [
            permissions["/phd/drcMember/generateCourseworkForm"],
          ],
        },
        {
          title: "Update sem dates",
          icon: <List />,
          url: "/phd/drc-convenor/update-semester-dates",
          requiredPermissions: [
            permissions["/phd/drcMember/generateCourseworkForm"],
          ],
        },
        {
          title: "Update QE Deadline",
          icon: <CalendarClockIcon />,
          url: "/phd/drc-convenor/update-qualifying-exam-deadline",
          requiredPermissions: [permissions["/phd/drcMember/updateDeadlines"]],
        },
        {
          title: "Generate QE Application List",
          icon: <Users />,
          url: "/phd/drc-convenor/generate-qualifying-exam-form",
          requiredPermissions: [
            permissions["/phd/drcMember/getQualifyingExamForm"],
          ],
        },
        {
          title: "QE Application details",
          icon: <NotepadText />,
          url: "/phd/drc-convenor/phd-that-applied-for-qualifying-exam",
          requiredPermissions: [permissions["/phd/drcMember/getPhD"]],
        },
        {
          title: "Update QE Results",
          icon: <FileCheck />,
          url: "/phd/drc-convenor/update-qualifying-exam-results-of-all-students",
          requiredPermissions: [permissions["/phd/drcMember/updateExam"]],
        },
        {
          title: "Update QE Passing Dates",
          icon: <CalendarCheck2 />,
          url: "/phd/drc-convenor/update-qualifying-exam-passing-dates",
          requiredPermissions: [permissions["/phd/drcMember/updateExamDates"]],
        },
        {
          title: "Update Proposal Deadline",
          icon: <CalendarX2 />,
          url: "/phd/drc-convenor/update-proposal-deadline",
          requiredPermissions: [permissions["/phd/drcMember/updateDeadlines"]],
        },
        {
          title: "Assign DAC Members",
          icon: <UserRoundPlus />,
          url: "/phd/drc-convenor/assign-dac-members",
          requiredPermissions: [permissions["/phd/drcMember/updateDeadlines"]],
        },
      ],
    },
    {
      title: "PhD Student",
      items: [
        {
          title: "QE Form Deadline",
          icon: <CalendarClockIcon />,
          url: "/phd/phd-student/form-deadline",
        },
        {
          title: "Qualifying Exam Status",
          icon: <List />,
          url: "/phd/phd-student/exam-status",
        },
        {
          title: "Proposal Submission",
          icon: <NotepadText />,
          url: "/phd/phd-student/proposal-submission",
        },
      ],
    },
    {
      title: "PhD Co-Supervisor",
      items: [
        {
          title: "Co-Supervised Students",
          icon: <Users />,
          url: "/phd/phd-co-supervisor/co-supervised-students",
        },
      ],
    },
    {
      title: "PhD Supervisor",
      items: [
        {
          title: "Supervised Students",
          icon: <Users />,
          url: "/phd/phd-supervisor/supervised-students",
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
