import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chatbot from "./components/Chatbot";
import SupplierForm from "./components/SupplierForm";
import Home from "./components/Home";  // Import the Home component
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} /> {/* Home Page */}
          <Route path="/supplier-form" element={<SupplierForm />} /> {/* Supplier Form */}
          <Route path="/chat" element={<Chatbot />} /> {/* Chatbot */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
