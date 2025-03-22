// import { AppSidebar } from "@/components/AppSidebar";
// import { useAuth } from "@/hooks/Auth";
// import { PersonIcon } from "@radix-ui/react-icons";
// import { Navigate, Outlet } from "react-router-dom";

import { Outlet } from "react-router-dom";

const DrcConvenorLayout = () => {
  // const { checkAccess } = useAuth();
  // Uncomment the line below once the permissions have been decided
  // return checkAccess("drc-convenor") ? <Outlet /> : <Navigate to="/" />;
  return <Outlet />;
};

export default DrcConvenorLayout;
