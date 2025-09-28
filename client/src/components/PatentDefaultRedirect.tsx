import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/Auth";
import { permissions } from "lib";

export default function PatentDefaultRedirect() {
  const { checkAccess } = useAuth();

  if (checkAccess(permissions["/patent/create"])) {
    return <Navigate to="/patent/add" replace={true} />;
  }
  
  if (checkAccess(permissions["/patent/bulkUpload"])) {
    return <Navigate to="/patent/add" replace={true} />;
  }
  
  if (checkAccess(permissions["/patent/list-all"])) {
    return <Navigate to="/patent/view-all" replace={true} />;
  }
  
  if (checkAccess(permissions["/patent/list"])) {
    return <Navigate to="/patent/view-your" replace={true} />;
  }
  
  if (checkAccess(permissions["/patent/edit-all"])) {
    return <Navigate to="/patent/edit-all" replace={true} />;
  }

  return <Navigate to="/patent/view-your" replace={true} />;
}
