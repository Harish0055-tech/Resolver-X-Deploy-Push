import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function RequireUser({ children }: { children: React.ReactNode }) {
    const { userRole } = useAuth();

    // If admin tries to access user-only routes, redirect to home
    if (userRole === 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
