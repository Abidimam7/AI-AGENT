// ProtectedRoute.js
import React from "react";
import { Route, Navigate } from "react-router-dom"; // Import Navigate
import { useAuth } from "../AuthContext";

const ProtectedRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useAuth();

  return (
    <Route
      {...rest}
      element={isAuthenticated ? element : <Navigate to="/" />} // Use Navigate instead of Redirect
    />
  );
};

export default ProtectedRoute;
