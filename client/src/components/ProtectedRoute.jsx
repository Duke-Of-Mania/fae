import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
 * ProtectedRoute
 *
 * Prevents unauthenticated users from accessing
 * routes that require a valid login session.
 *
 * currentUser is supplied by App.jsx.
 */
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
    
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // The user is authenticated, so render whatever
  // component was placed inside ProtectedRoute.
  return children;
}

export default ProtectedRoute;