import { useAuth } from "@/hooks/Auth";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Represents a protected layout component.
 * This component is responsible for rendering the protected layout of the application.
 * It checks the authentication state and renders the child components if the user is authenticated,
 * otherwise it redirects to the home page.
 */
const ProtectedLayout = () => {
  const { authState } = useAuth();
  return authState ? (
    <>
      <div className="flex">
        <Outlet />
      </div>
    </>
  ) : (
    <Navigate to="/" />
  );
};

export default ProtectedLayout;
