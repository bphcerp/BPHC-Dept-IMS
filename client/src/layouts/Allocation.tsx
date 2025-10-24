import { AppSidebar } from "@/components/AppSidebar";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import {
  BookIcon,
  ClipboardCheckIcon,
  ClockArrowDownIcon,
  DatabaseIcon,
  FrameIcon,
  SendIcon,
  TableOfContentsIcon,
  GroupIcon,
  Grid3X3Icon,
} from "lucide-react";
import { SemesterMinimal } from "node_modules/lib/src/types/allocation";
import { Outlet } from "react-router-dom";

const AllocationLayout = () => {
  const { data: currentSemester } = useQuery({
    queryKey: ["semester", "latest"],
    queryFn: () =>
      api
        .get<SemesterMinimal>("/allocation/semester/getLatest?minimal=true")
        .then(({ data }) => data),
  });

  return (
    <>
      <AppSidebar
        items={[
          // This section should be visible to all users with allocation write permissions
          {
            title: "Admin Control",
            items: [
              {
                title: "Overview",
                icon: <ClockArrowDownIcon />,
                url: "/allocation/overview",
                requiredPermissions: ["allocation:write"],
              },
              ...(currentSemester?.allocationStatus === "inAllocation"
                ? [
                    {
                      title: "Matrix",
                      icon: <Grid3X3Icon />,
                      url: "/allocation/creditmatrix",
                      requiredPermissions: ["allocation:write"],
                    },
                  ]
                : []),
              {
                title: "Courses",
                icon: <DatabaseIcon />,
                url: "/allocation/courses",
                requiredPermissions: ["allocation:courses:view"],
              },
              {
                title: "Course Groups",
                icon: <GroupIcon />,
                url: "/allocation/course-groups",
                requiredPermissions: ["allocation:courses:write"],
              },
              {
                title: "Semesters",
                icon: <BookIcon />,
                url: "/allocation/semesters",
                requiredPermissions: ["allocation:semesters:view"],
              },
              {
                title: "Allocation",
                icon: <ClipboardCheckIcon />,
                url: "/allocation/allocate",
                requiredPermissions: ["allocation:write"],
              },
            ],
          },
          ...(!!currentSemester
            ? [
                {
                  title: "Course Allocation",
                  items: [
                    {
                      title: "Summary",
                      icon: <TableOfContentsIcon />,
                      url: "/allocation/summary",
                      requiredPermissions: [
                        currentSemester?.summaryHidden
                          ? "allocation:write"
                          : "allocation:summary:view",
                      ],
                    },
                    ...(currentSemester?.allocationStatus === "formCollection"
                      ? [
                          {
                            title: "Submit Your Preferences",
                            icon: <SendIcon />,
                            url: `/allocation/submit`,
                            requiredPermissions: [
                              "allocation:form:response:submit",
                            ],
                          },
                        ]
                      : []),
                  ],
                },
              ]
            : []),
          {
            title: "Forms",
            items: [
              {
                title: "Templates",
                icon: <FrameIcon />,
                url: "/allocation/templates",
                requiredPermissions: [
                  "allocation:write",
                  "allocation:builder:template:view",
                ],
              },
              {
                title: "Forms",
                icon: <ClipboardCheckIcon />,
                url: "/allocation/forms",
                requiredPermissions: [
                  "allocation:write",
                  "allocation:builder:form:view",
                ],
              },
            ],
          },
        ]}
      />
      <div className="h-screen w-full overflow-y-auto">
        <Outlet />
      </div>
    </>
  );
};

export default AllocationLayout;
