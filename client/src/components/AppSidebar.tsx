import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
  } from "@/components/ui/sidebar"
  import logo from "/logo/bitspilanilogo.png";
  import { Button } from "@/components/ui/button"; // Import shadcn Button
import axios from "axios";
   
  export function AppSidebar() {
    function handleLogout(){ // to be refined once backend is complete
      axios.post(`${import.meta.env.VITE_PROD_SERVER_URL}/auth/logout`)
    }
    return (
      <Sidebar>
        <SidebarHeader>
        <div className="flex items-center gap-1">
          <img src={logo} alt="Logo" className="w-16 h-auto" />
          <span className="text-lg font-bold">EEE ERP ADMIN</span>
        </div>
      </SidebarHeader>
        <SidebarContent>
          <SidebarGroup />
          <SidebarGroup />
        </SidebarContent>
        <SidebarFooter>
        <Button className="w-full" onClick={handleLogout}>
          LOGOUT
        </Button>
      </SidebarFooter>
      </Sidebar>
    )
  }