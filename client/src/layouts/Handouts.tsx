import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

const HandoutLayout = () => {
  return (
    <>
      <AppSidebar items={[]} />
      <Outlet />
    </>
  );
};

export default HandoutLayout;
