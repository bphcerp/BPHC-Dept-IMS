import { Outlet } from "react-router-dom";

const PhDStudentLayout = () => {
  // const { checkAccess } = useAuth();
  // Uncomment the line below once the permissions have been decided
  // return checkAccess("notional-supervisor") ? <Outlet /> : <Navigate to="/" />;
  return <Outlet />;
};

export default PhDStudentLayout;
