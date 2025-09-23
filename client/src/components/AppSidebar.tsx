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
import logo from "/logo/bitspilanilogo.png";
import { useAuth } from "@/hooks/Auth";
import { Link, useLocation } from "react-router-dom";
import api from "@/lib/axios-instance";
import { DEPARTMENT_NAME, LOGIN_ENDPOINT } from "@/lib/constants";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { ArrowLeftIcon, Users, LogOut, BookMarked } from "lucide-react";
import { toast } from "sonner";

export interface SidebarMenuItem {
  title: string;
  icon: React.ReactNode;
  url: string;
  requiredPermissions?: string[];
}

export interface SidebarMenuGroup {
  title: string;
  items: SidebarMenuItem[];
}

export const AppSidebar = ({ items }: { items: SidebarMenuGroup[] }) => {
  const { authState, logOut, setNewAuthToken, checkAccessAnyOne } = useAuth();
  const { pathname } = useLocation();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const onSuccess = (credentialResponse: CredentialResponse) => {
    api
      .post<{ token: string }>(LOGIN_ENDPOINT, {
        token: credentialResponse.credential,
      })
      .then((response) => {
        setNewAuthToken(response.data.token);
      })
      .catch(() => {
        toast.error("An error occurred while logging in");
      });
  };

  return (
    <>
      {isMobile && (
        <div className="fixed left-4 top-4 z-50 md:hidden">
          <SidebarTrigger className="border-2 border-border bg-background shadow-lg hover:bg-accent" />
        </div>
      )}

      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <Link to="/" className="flex min-w-0 items-center gap-1">
              {!isCollapsed && pathname !== "/" && (
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
            </Link>
            <SidebarTrigger className="hidden shrink-0 md:flex" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {items.map((group) => {
            const filteredGroupItems = group.items.filter((item) =>
              checkAccessAnyOne(item.requiredPermissions ?? [])
            );
            return filteredGroupItems.length ? (
              <SidebarGroup key={group.title} title={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredGroupItems
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname.includes(item.url)}
                            className="items-start"
                          >
                            <Link to={item.url}>
                              {item.icon}
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : null;
          })}
        </SidebarContent>

        <SidebarFooter>
          {/* Wiki Button */}
          {authState && (
            <SidebarMenuButton
              asChild
              tooltip="Help"
              className="flex items-start gap-2 mb-1"
            >
              <Link to="/help">
                <BookMarked className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Help</span>}
              </Link>
            </SidebarMenuButton>
          )}

          {/* View Contributors Button */}
          {!pathname.startsWith("/contributors") && (
            <SidebarMenuButton
              asChild
              tooltip="View Contributors"
              className="flex items-start gap-2"
            >
              <Link to="/contributors">
                <Users className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>View Contributors</span>}
              </Link>
            </SidebarMenuButton>
          )}

          {authState ? (
            <>
              <SidebarMenuButton
                onClick={logOut}
                tooltip="Logout"
                className="flex items-start gap-2 overflow-visible"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <div className="relative w-full">
                    LOGOUT
                    <span className="absolute -left-6 top-4 w-[calc(100%+1.5rem)] truncate text-xs text-muted">
                      {authState.email}
                    </span>
                  </div>
                )}
              </SidebarMenuButton>
              {!isCollapsed && <div className="px-2 py-1"></div>}
            </>
          ) : (
            !isCollapsed && <GoogleLogin onSuccess={onSuccess} />
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
};