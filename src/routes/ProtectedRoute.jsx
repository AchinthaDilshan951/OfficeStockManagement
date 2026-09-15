import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ allowedRole }) {
  const token = localStorage.getItem("token");

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    currentUser = null;
  }

  if (!token || !currentUser) {
    return <Navigate to="/" replace />;
  }

  if (
    allowedRole &&
    currentUser.role !== allowedRole
  ) {
    const correctDashboard =
      currentUser.role === "Admin"
        ? "/admin/dashboard"
        : "/user/dashboard";

    return (
      <Navigate
        to={correctDashboard}
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;