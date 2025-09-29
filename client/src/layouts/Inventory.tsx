import { AppSidebar } from "@/components/AppSidebar";
import { BarChartIcon, GearIcon } from "@radix-ui/react-icons";
import { Warehouse } from "lucide-react";
import { Outlet } from "react-router-dom";
import "@/css/inventory/index.css";

const InventoryLayout = () => {
  return (
    <>
      <AppSidebar
        items={[
          {
            title: "Inventory",
            items: [
              {
                title: "Items",
                icon: <Warehouse />,
                url: "/inventory/items",
              },
              {
                title: "Stats",
                icon: <BarChartIcon />,
                url: "/inventory/stats",
              },
              {
                title: "Settings",
                icon: <GearIcon />,
                url: "/inventory/settings",
                requiredPermissions: ["inventory:write"],
              },
            ],
          },
        ]}
      />
      <div className="w-full overflow-y-auto h-screen">
        <Outlet />
      </div>
    </>
  );
};

export default InventoryLayout;
