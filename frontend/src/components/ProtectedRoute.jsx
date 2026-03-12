import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRole, children }) => {
  let token = localStorage.getItem("token");
  let userStr = localStorage.getItem("user");
  let user = userStr ? JSON.parse(userStr) : null;


  // Not logged in
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // Role not allowed
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
