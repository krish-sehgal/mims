import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Spinner } from "../components/ui";

export function RequireAuth() {
    const { status } = useAuth();
    const location = useLocation();

    if (status === "loading") {
        return (
            <div className="page-center">
                <Spinner />
            </div>
        );
    }

    if (status === "guest") {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}
