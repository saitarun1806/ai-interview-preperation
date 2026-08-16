import { Navigate, Outlet } from "react-router-dom";
import { isTokenValid } from "../utils/tokenUtils";

function ProtectedRoute() {
    if (!isTokenValid()) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;