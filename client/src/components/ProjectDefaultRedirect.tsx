import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/Auth";
import { permissions } from "lib";

export default function ProjectDefaultRedirect() {
    const { checkAccess } = useAuth();

    if (checkAccess(permissions["/project/create"])) {
        return <Navigate to="/project/add" replace={true} />;
    }

    if (checkAccess(permissions["/project/bulkUpload"])) {
        return <Navigate to="/project/add" replace={true} />;
    }

    if (checkAccess(permissions["/project/list-all"])) {
        return <Navigate to="/project/view-all" replace={true} />;
    }

    if (checkAccess(permissions["/project/list"])) {
        return <Navigate to="/project/view-your" replace={true} />;
    }

    if (checkAccess(permissions["/project/edit-all"])) {
        return <Navigate to="/project/edit-all" replace={true} />;
    }

    return <Navigate to="/project/view-your" replace={true} />;
}
