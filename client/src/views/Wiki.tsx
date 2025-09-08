import React, { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import logo from "/logo/bitspilanilogo.png";
import { DEPARTMENT_NAME } from "@/lib/constants";
import { Computer, FileText, GraduationCap, BookOpen, LibraryBig, Warehouse, File, ArrowLeftIcon, Users, LogOut, BookMarked } from "lucide-react";

const modules = [
  {
    title: "Modules",
    items: [
      { title: "Admin", icon: <Computer />, doc: "/app-docs/main.pdf" },
      { title: "Conference Approval", icon: <FileText />, doc: "/app-docs/conference.pdf" },
      { title: "Course Handouts", icon: <BookOpen />, doc: "/app-docs/handouts.pdf" },
      { title: "Inventory", icon: <Warehouse />, doc: "/app-docs/inventory.pdf" },
      { title: "Patent", icon: <File />, doc: "/app-docs/patent.pdf" },
      { title: "PhD", icon: <GraduationCap />, doc: "/app-docs/phd.pdf" },
      { title: "Project", icon: <File />, doc: "/app-docs/project.pdf" },
      { title: "Publications", icon: <LibraryBig />, doc: "/app-docs/publications.pdf" },
      { title: "QP Review", icon: <FileText />, doc: "/app-docs/qp-review.pdf" },
      { title: "WILP Projects", icon: <BookOpen />, doc: "/app-docs/wilp.pdf" },
    ],
  },
];

const WikiPage = () => {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docExists, setDocExists] = useState<boolean | null>(null);
  const { state } = useSidebar ? useSidebar() : { state: "expanded" };
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();
  const lastCheckedDoc = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedDoc) {
      setDocExists(null);
      return;
    }
    // Always check, even if the same doc is selected again
  fetch(selectedDoc.startsWith("/") ? selectedDoc : "client/public" + selectedDoc, { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          setDocExists(true);
        } else {
          setDocExists(false);
          setTimeout(() => navigate("../404", { replace: true }), 0);
        }
      })
      .catch(() => {
        setDocExists(false);
        setTimeout(() => navigate("../404", { replace: true }), 0);
      });
  }, [selectedDoc, navigate]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <button
              className="flex min-w-0 items-center gap-1"
              onClick={() => (window.location.href = "/")}
              style={{ background: "none", border: "none", padding: 0 }}
            >
              {!isCollapsed && (
                <ArrowLeftIcon className="h-6 w-6 shrink-0" />
              )}
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
            </button>
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
                        isActive={selectedDoc === item.doc}
                        className="items-start"
                        onClick={() => setSelectedDoc(item.doc)}
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
        <SidebarFooter>
          <SidebarMenuButton
            tooltip="Wiki"
            className="flex items-start gap-2 mb-1"
            isActive={true}
          >
            <BookMarked className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Wiki</span>}
          </SidebarMenuButton>
          <SidebarMenuButton
            tooltip="View Contributors"
            className="flex items-start gap-2"
            onClick={() => setSelectedDoc(null)}
          >
            <Users className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>View Contributors</span>}
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      
      <div className="flex-1 h-screen w-full p-8">
        {selectedDoc && docExists ? (
          <iframe
            src={selectedDoc}
            title="PDF Document"
            className="w-full h-full border-0"
            style={{ minHeight: "100vh" }}
          />
        ) : (
          <div className="flex justify-center items-center h-full bg-white">
            <div className="text-gray-400 text-lg">
              Select a module from the sidebar to view its documentation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WikiPage;