import { AppSidebar } from "@/components/AppSidebar";
import { BarChartIcon, GearIcon } from "@radix-ui/react-icons";
import { Warehouse } from "lucide-react";
import { Outlet } from "react-router-dom";

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
      <div className="overflow-y-auto w-full">
        <Outlet />
      </div>
    </>
  );
};

export default InventoryLayout;
