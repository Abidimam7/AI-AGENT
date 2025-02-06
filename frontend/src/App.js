import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chatbot from "./components/Chatbot/Chatbot";
import SupplierForm from "./components/Forms/SupplierForm";
import Home from "./pages/Home/Home";
import Login from "./components/Forms/Login";  
import Register from "./components/Forms/Register";  

import "./styles/App.css";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />  
          <Route path="/login" element={<Login />} /> 
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/supplier-form" element={<SupplierForm />} />
          <Route path="/chat" element={<Chatbot />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
