import { useAuth } from "@/hooks/Auth";
import { Navigate, Outlet } from "react-router-dom";

const AdminLayout = () => {
  const { checkAccess } = useAuth();
  // Only allow access to the admin layout if the user has the "admin" permission
  return checkAccess("admin") ? <Outlet /> : <Navigate to="/" />;
};

export default AdminLayout;
