import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("retailer" | "manufacturer" | "super_admin")[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const appType = import.meta.env.VITE_APP_TYPE;
    let loginPath = "/retailer/login";
    if (appType === "manufacturer") loginPath = "/manufacturer/login";
    if (appType === "admin") loginPath = "/super-admin/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole as any)) {
    // Redirect to appropriate dashboard based on role
    const getRedirectPath = () => {
      if (userRole === "super_admin") return "/super-admin";
      if (userRole === "manufacturer") return "/manufacturer";
      return "/shop";
    };
    return <Navigate to={getRedirectPath()} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
