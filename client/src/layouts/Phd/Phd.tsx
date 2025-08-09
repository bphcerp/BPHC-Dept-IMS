// client/src/layouts/Phd/Phd.tsx

import { AppSidebar } from "@/components/AppSidebar";
import {
  ClipboardCheck, Users, FileText, UserCog, Presentation, UserCircle,
  FileQuestion, FileSpreadsheet, Calendar, Clock, BookOpen, UserCheck,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { permissions } from "lib";

const PhdLayout = () => {
  const items = [
    {
      title: "PhD Scholar",
      items: [
        {
          title: "My Profile",
          icon: <UserCircle />,
          url: "/phd/student/my-profile",
          requiredPermissions: [permissions["/phd/student/getProfileDetails"]],
        },
        {
          title: "Qualifying Exam",
          icon: <ClipboardCheck />,
          url: "/phd/student/form-deadline",
          requiredPermissions: [permissions["/phd/student/applications"]],
        },
        {
          title: "Thesis Proposal",
          icon: <FileText />,
          url: "/phd/student/proposal-submission",
          requiredPermissions: [permissions["/phd/student/uploadProposalDocuments"]],
        },
      ],
    },
    {
      title: "Supervisor Roles",
      items: [
        {
          title: "Course & Grade Management",
          icon: <UserCog />,
          url: "/phd/notional-supervisor/update-grade",
          requiredPermissions: [permissions["/phd/notionalSupervisor/getPhd"]],
        },
        {
          title: "Supervised Students",
          icon: <Users />,
          url: "/phd/supervisor/supervised-students",
          requiredPermissions: [permissions["/phd/supervisor/getSupervisedStudents"]],
        },
        {
          title: "Suggest Examiners",
          icon: <UserCheck />,
          url: "/phd/notional-supervisor/suggest-examiner",
          requiredPermissions: [permissions["/phd/supervisor/pending-suggestions"]],
        },
        {
          title: "Co-Supervised Students",
          icon: <Users />,
          url: "/phd/co-supervisor/co-supervised-students",
          requiredPermissions: [permissions["/phd/coSupervisor/getCoSupervisedStudents"]],
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
          requiredPermissions: [permissions["/phd/drcMember/generateCourseworkForm"]],
        },
        {
          title: "Qualifying Exam Management",
          icon: <FileQuestion />,
          url: "/phd/drc-convenor/qualifying-exam-management",
          requiredPermissions: [permissions["/phd/drcMember/exam-events/applications"]],
        },
        {
          title: "Proposal & DAC Management",
          icon: <Presentation />,
          url: "/phd/drc-convenor/assign-dac-members",
          requiredPermissions: [permissions["/phd/drcMember/getSuggestedDacMember"]],
        },
      ],
    },
    {
      title: "Staff",
      items: [
        {
          title: "Manage Semesters",
          icon: <Calendar />,
          url: "/phd/staff/update-semester-dates",
          requiredPermissions: [permissions["/phd/staff/semesters"]],
        },
        {
          title: "Manage Exam Events",
          icon: <Clock />,
          url: "/phd/staff/manage-exam-events",
          requiredPermissions: [permissions["/phd/staff/exam-events"]],
        },
        {
          title: "Manage Sub-Areas",
          icon: <FileSpreadsheet />,
          url: "/phd/staff/update-subareas",
          requiredPermissions: [permissions["/phd/staff/sub-areas"]],
        },
      ],
    },
  ];

  return (
    <>
      <AppSidebar items={items} />
      <div className="flex-1 p-4 md:p-8">
        <Outlet />
      </div>
    </>
  );
};

export default PhdLayout;