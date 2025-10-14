import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/Auth";
import { permissions } from "lib";

export default function GradesDefaultRedirect() {
    const { checkAccess } = useAuth();

    console.log('GradesDefaultRedirect - Checking permissions...');
    console.log('Has upload permission:', checkAccess(permissions["/grades/upload"]));
    console.log('Has manage permission:', checkAccess(permissions["/grades/manage"]));
    console.log('Has supervisor permission:', checkAccess(permissions["/grades/supervisor"]));
    console.log('Has instructor permission:', checkAccess(permissions["/grades/instructor"]));

    if (checkAccess(permissions["/grades/upload"])) {
        console.log('Redirecting to /grades/upload');
        return <Navigate to="/grades/upload" replace={true} />;
    }

    if (checkAccess(permissions["/grades/manage"])) {
        console.log('Redirecting to /grades/manage');
        return <Navigate to="/grades/manage" replace={true} />;
    }

    if (checkAccess(permissions["/grades/supervisor"]) || checkAccess(permissions["/grades/instructor"])) {
        console.log('Redirecting to /grades/assign-grades');
        return <Navigate to="/grades/assign-grades" replace={true} />;
    }

    console.log('No permissions, redirecting to /');
    return <Navigate to="/" replace={true} />;
}

