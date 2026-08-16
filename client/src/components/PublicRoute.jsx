import { Navigate, Outlet } from "react-router-dom";
import { isTokenValid } from "../utils/tokenUtils";

function PublicRoute() {
    if (isTokenValid()) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

export default PublicRoute;