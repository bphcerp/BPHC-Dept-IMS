import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "/logo/bitspilanilogo.png";
import { DEPARTMENT_NAME } from "@/lib/constants";
import {
  Computer,
  FileText,
  GraduationCap,
  BookOpen,
  LibraryBig,
  Warehouse,
  File,
  ArrowLeftIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

const modules = [
  {
    title: "Modules",
    items: [
      { title: "Admin", icon: <Computer />, doc: "/app-docs/main.pdf" },
      {
        title: "Conference Approval",
        icon: <FileText />,
        doc: "/app-docs/conference.pdf",
      },
      {
        title: "Course Handouts",
        icon: <BookOpen />,
        doc: "/app-docs/handouts.pdf",
      },
      {
        title: "Inventory",
        icon: <Warehouse />,
        doc: "/app-docs/inventory.pdf",
      },
      { title: "Patent", icon: <File />, doc: "/app-docs/patent.pdf" },
      { title: "PhD", icon: <GraduationCap />, doc: "/app-docs/wip.pdf" },
      { title: "Project", icon: <File />, doc: "/app-docs/project.pdf" },
      {
        title: "Publications",
        icon: <LibraryBig />,
        doc: "/app-docs/publications.pdf",
      },
      {
        title: "QP Review",
        icon: <FileText />,
        doc: "/app-docs/wip.pdf",
      },
      { title: "WILP Projects", icon: <BookOpen />, doc: "/app-docs/wilp.pdf" },
    ],
  },
];

const HelpPage = () => {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <Link to="/" className="flex min-w-0 items-center gap-1">
              {!isCollapsed && <ArrowLeftIcon className="h-6 w-6 shrink-0" />}
              {!isCollapsed && (
                <img
                  src={logo}
                  alt="Logo"
                  className="aspect-square h-16 w-16 shrink-0 object-contain"
                />
              )}
              {!isCollapsed && (
                <span className="truncate pt-1 text-lg font-bold">
                  {DEPARTMENT_NAME} IMS
                </span>
              )}
            </Link>
            <SidebarTrigger className="hidden shrink-0 md:flex" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {modules.map((group) => (
            <SidebarGroup key={group.title} title={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={selectedModule === item.title}
                        className="items-start"
                        onClick={() => {
                          setSelectedDoc(item.doc);
                          setSelectedModule(item.title);
                        }}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>

      <div className="h-screen w-full flex-1 p-8">
        {selectedDoc ? (
          <embed
            src={selectedDoc}
            type="application/pdf"
            width="100%"
            height="100%"
            style={{ minHeight: "100vh", border: "none" }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white">
            <div className="text-lg text-gray-400">
              Select a module from the sidebar to view its documentation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPage;
