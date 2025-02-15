// frontend/src/components/Chatbot/Chatbot.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import CompanySidebar from "../../components/Sidebar/CompanySidebar";
import ChatMessages from "../../components/Chatbot/ChatMessages";
import ChatInput from "../../components/Chatbot/ChatInput";
import { createBotMessage, processBotResponse } from "../../components/Chatbot/chatHelpers";
import "./Chatbot.css";

// Dynamic API base URL from the environment variable.
const baseUrl = process.env.REACT_APP_API_BASE_URL; // e.g., "http://127.0.0.1:8000/api"

const Chatbot = () => {
  // State declarations
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [activeLead, setActiveLead] = useState(null);
  const [botTyping, setBotTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState({});
  const [companyDetails, setCompanyDetails] = useState(null);
  const [leads, setLeads] = useState([]);         // AI-generated leads (temporary)
  const [savedLeads, setSavedLeads] = useState([]); // Permanently saved leads
  const [isSending, setIsSending] = useState(false);
  const [awaitingExtraDetails, setAwaitingExtraDetails] = useState(false);
  const chatEndRef = useRef(null);

  // Removed suggestions since we are not using them anymore.

  // Load company details and any previously saved leads on mount
  useEffect(() => {
    const savedDetails = sessionStorage.getItem("companyDetails");
    if (savedDetails) {
      setCompanyDetails(JSON.parse(savedDetails));
    }
    const storedSavedLeads = localStorage.getItem("savedLeads");
    if (storedSavedLeads) {
      setSavedLeads(JSON.parse(storedSavedLeads));
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return;
    sendUserMessage(userInput);
  };

  const sendUserMessage = async (message) => {
    // If user types "save" and there are generated leads, save them permanently.
    if (message.trim().toLowerCase() === "save" && leads.length > 0) {
      const token = localStorage.getItem("token");
      try {
        const payload = {
          supplier_id: activeLead ? activeLead.id : null,
          leads: leads.map((lead) => ({
            ...lead,
            // Mark these as AI-generated. (Alternatively, use a 'source' field.)
            is_generated: true,
          })),
        };

        const response = await axios.post(
          `${baseUrl}/save-generated-leads/`,
          payload,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
        setSavedLeads(response.data);
        localStorage.setItem("savedLeads", JSON.stringify(response.data));
        addBotMessage("Leads saved successfully!");
      } catch (err) {
        console.error("Error saving leads:", err);
        addBotMessage("Failed to save leads. Please try again.");
      }
      // Clear temporary generated leads and user input.
      setLeads([]);
      setUserInput("");
      return;
    }

    // If extra details are awaited for lead generation
    if (activeLead && awaitingExtraDetails) {
      const parts = message.split(",");
      if (parts.length >= 2) {
        const location = parts[0].trim();
        const num_leads = parts[1].trim();
        setConversationContext((prev) => ({ ...prev, location, num_leads }));
        addBotMessage(
          `Received location: ${location} and number of leads: ${num_leads}. Generating leads...`
        );
        setAwaitingExtraDetails(false);
        await generateLeads(activeLead);
      } else {
        addBotMessage("Invalid format. Please provide details in the format: <location>,<number>");
      }
      return;
    }

    // Normal chat message processing
    const userMessage = { type: "user", message };
    setChatHistory((prev) => [...prev, userMessage]);
    setUserInput("");
    setBotTyping(true);
    setIsSending(true);

    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${baseUrl}/chat/`,
        {
          user_input: message,
          context: conversationContext,
          active_lead: activeLead,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      if (response.data?.leads) {
        setLeads(response.data.leads);
        // Display a formatted message in chat area for generated leads.
        let leadMessage = "Generated Leads:\n";
        response.data.leads.forEach((lead, idx) => {
          leadMessage += `${idx + 1}. Company: ${lead.company_name}, Email: ${lead.email}, Phone: ${lead.phone}, Address: ${lead.address}`;
          if (lead.is_generated) {
            leadMessage += " [AI Generated]";
          }
          leadMessage += "\n";
        });
        addBotMessage(leadMessage);
      } else if (response.data?.message) {
        processBotResponse(response.data, setChatHistory, setConversationContext);
      }
    } catch (error) {
      console.error("API Error:", error);
      handleError(error);
    }
    setBotTyping(false);
    setIsSending(false);
  };

  // Function to generate leads using supplier info and extra details.
  const generateLeads = async (supplierInfo) => {
    setActiveLead(supplierInfo);
    const companyMessage = `Selected Supplier:
Company: ${supplierInfo.company_name}
Product: ${supplierInfo.product_name}
Description: ${supplierInfo.product_description}`;
    setChatHistory((prev) => [...prev, { type: "user", message: companyMessage }]);

    if (!conversationContext.location || !conversationContext.num_leads) {
      addBotMessage(
        "Please provide the location and number of leads to generate, in the format: <location>,<number>"
      );
      setAwaitingExtraDetails(true);
      setBotTyping(false);
      return;
    }

    setBotTyping(true);
    const token = localStorage.getItem("token");
    try {
      const { location, num_leads } = conversationContext;
      const response = await axios.post(
        `${baseUrl}/chat/`,
        {
          user_input: "",
          context: conversationContext,
          active_lead: supplierInfo,
          location: location,
          num_leads: num_leads,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      if (response.data?.leads) {
        setLeads(response.data.leads);
        let leadMessage = "Generated Leads:\n";
        response.data.leads.forEach((lead, idx) => {
          leadMessage += `${idx + 1}. Company: ${lead.company_name}, Email: ${lead.email}, Phone: ${lead.phone}, Address: ${lead.address}`;
          if (lead.is_generated) {
            leadMessage += " [AI Generated]";
          }
          leadMessage += "\n";
        });
        addBotMessage(leadMessage);
      } else if (response.data?.message) {
        processBotResponse(response.data, setChatHistory, setConversationContext);
      }
    } catch (error) {
      console.error("Lead Generation API Error:", error);
      handleError(error);
    }
    setBotTyping(false);
  };

  // Error handler for API errors.
  const handleError = (error) => {
    if (error.response) {
      addBotMessage(`Server error: ${error.response.data.message || "Please try again later."}`);
    } else if (error.request) {
      addBotMessage("No response from server. Check your internet connection.");
    } else {
      addBotMessage("Unexpected error occurred. Please try again.");
    }
  };

  // Helper function to add a bot message to the chat history.
  const addBotMessage = (message) => {
    setChatHistory((prev) => [...prev, createBotMessage(message, [])]);
  };

  // Handler when a supplier is selected from the sidebar.
  const handleCompanySelect = (company) => {
    generateLeads(company);
  };

  // Function to start a new chat by clearing the chat history.
  const handleNewChat = () => {
    setChatHistory([]);
  };

  return (
    <div className="chat-app">
      <CompanySidebar
        onCompanySelect={handleCompanySelect}
        initialSelected={companyDetails}
        onGenerateLeads={generateLeads}
        onNewChat={handleNewChat}
      />

      <div className="main-chat">
        <div className="chat-container">
          <div className="chat-header">
            <h1>Lead Generation Assistant</h1>
            <p>AI-powered lead research and analysis</p>
          </div>

          <ChatMessages
            chatHistory={chatHistory}
            botTyping={botTyping}
            setUserInput={setUserInput}
            chatEndRef={chatEndRef}
          />

          <ChatInput
            userInput={userInput}
            setUserInput={setUserInput}
            handleSubmit={handleSubmit}
            isSending={isSending}
          />
        </div>
      </div>

      {/* Home Button */}
      <button
        className="home-button"
        onClick={() => (window.location.href = "/home")}
      >
        Home
      </button>
    </div>
  );
};

export default Chatbot;
