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
import { Link } from "react-router-dom";

export interface SidebarMenuItem {
  title: string;
  icon: React.ReactNode;
  url: string;
}

export interface SidebarMenuGroup {
  title: string;
  items: SidebarMenuItem[];
}

export function AppSidebar({ items }: { items: SidebarMenuGroup[] }) {
  const { logOut } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-1">
          <img src={logo} alt="Logo" className="h-auto w-16" />
          <span className="text-lg font-bold">EEE ERP</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {items.map((group) => (
          <SidebarGroup key={group.title} title={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
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
        ))}
      </SidebarContent>
      <SidebarFooter>
        <Button className="w-full" onClick={logOut}>
          LOGOUT
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
