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
} from "@/components/ui/sidebar";
import logo from "/logo/bitspilanilogo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/Auth";
import { Link, useLocation } from "react-router-dom";
import api from "@/lib/axios-instance";
import { LOGIN_ENDPOINT } from "@/lib/constants";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";

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
  const onSuccess = (credentialResponse: CredentialResponse) => {
    api
      .post<{ token: string }>(LOGIN_ENDPOINT, {
        token: credentialResponse.credential,
      })
      .then((response) => {
        setNewAuthToken(response.data.token);
      })
      .catch(() => {
        // notify login failed
      });
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-1">
          <img src={logo} alt="Logo" className="h-auto w-16" />
          <span className="text-lg font-bold">EEE ERP</span>
        </Link>
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
                  {filteredGroupItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.includes(item.url)}
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
        {authState ? (
          <Button className="w-full" onClick={logOut}>
            LOGOUT
          </Button>
        ) : (
          <GoogleLogin onSuccess={onSuccess} />
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
