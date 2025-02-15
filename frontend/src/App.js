import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Chatbot from "./components/Chatbot/Chatbot";
import SupplierForm from "./components/Forms/SupplierForm";
import Home from "./pages/Home/Home";
import Login from "./components/Forms/Login";  
import Register from "./components/Forms/Register";  



import "./styles/App.css";
import "bootstrap/dist/css/bootstrap.min.css";

// ProtectedRoute component to protect routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />  
          <Route path="/login" element={<Login />} /> 
          <Route path="/register" element={<Register />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier-form"
            element={
              <ProtectedRoute>
                <SupplierForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            }
          />
          {/* Catch-all route: redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
