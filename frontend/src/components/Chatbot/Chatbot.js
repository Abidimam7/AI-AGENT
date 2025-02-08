import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CompanySidebar from '../../components/Sidebar/CompanySidebar';
import ChatMessages from '../../components/Chatbot/ChatMessages';
import ChatInput from '../../components/Chatbot/ChatInput';
import { createBotMessage, processBotResponse } from '../../components/Chatbot/chatHelpers';
import './Chatbot.css';

const Chatbot = () => {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [activeLead, setActiveLead] = useState(null);
  const [botTyping, setBotTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState({});
  const [companyDetails, setCompanyDetails] = useState(null);
  const [leads, setLeads] = useState([]); // Currently generated leads (shown in chat)
  const [savedLeads, setSavedLeads] = useState([]); // Leads saved via "save" command
  const [isSending, setIsSending] = useState(false);
  const [awaitingExtraDetails, setAwaitingExtraDetails] = useState(false);
  const chatEndRef = useRef(null);

  const suggestions = [
    "Show me recent leads in tech",
    "Analyze healthcare industry trends",
    "Suggest follow-up strategies",
    "Create lead scoring criteria"
  ];

  // Load company details from sessionStorage on mount
  useEffect(() => {
    const savedDetails = sessionStorage.getItem("companyDetails");
    if (savedDetails) {
      setCompanyDetails(JSON.parse(savedDetails));
    }
  }, []);

  // Function to handle regular chat message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return; // Prevent empty and multiple submissions
    sendUserMessage(userInput);
  };

  // Regular chat message sending and intercepting extra details / save command
  const sendUserMessage = async (message) => {
    // Check if user typed "save" (case-insensitive) to save generated leads
    if (message.trim().toLowerCase() === "save" && leads.length > 0) {
      setSavedLeads(leads);
      addBotMessage("Leads have been saved. You can view them by clicking the 'Generated Leads' option in the sidebar.");
      // Optionally, clear current leads from chat area:
      setLeads([]);
      setUserInput('');
      return;
    }

    // If a supplier is selected and we're awaiting extra details (location, num_leads)
    if (activeLead && awaitingExtraDetails) {
      const parts = message.split(",");
      if (parts.length >= 2) {
        const location = parts[0].trim();
        const num_leads = parts[1].trim();
        setConversationContext(prev => ({ ...prev, location, num_leads }));
        addBotMessage(`Received location: ${location} and number of leads: ${num_leads}. Generating leads...`);
        setAwaitingExtraDetails(false);
        await generateLeads(activeLead);
      } else {
        addBotMessage("Invalid format. Please provide details in the format: <location>,<number>");
      }
      return;
    }

    // Process as a regular chat message
    const userMessage = { type: 'user', message };
    setChatHistory(prev => [...prev, userMessage]);
    setUserInput('');
    setBotTyping(true);
    setIsSending(true);

    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/chat/',
        {
          user_input: message,
          context: conversationContext,
          active_lead: activeLead,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      if (response.data?.leads) {
        setLeads(response.data.leads);
        addBotMessage("Leads generated successfully and updated in the sidebar. Type 'save' to confirm.");
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

  // Function to generate leads using supplier info and extra details (location, num_leads)
  const generateLeads = async (supplierInfo) => {
    setActiveLead(supplierInfo);
    // Add supplier info to chat history
    const companyMessage = `Selected Supplier:
Company: ${supplierInfo.company_name}
Product: ${supplierInfo.product_name}
Description: ${supplierInfo.product_description}`;
    setChatHistory(prev => [...prev, { type: 'user', message: companyMessage }]);

    // If extra details are not yet provided, prompt and set awaiting state.
    if (!conversationContext.location || !conversationContext.num_leads) {
      addBotMessage("Please provide the location and number of leads to generate, in the format: <location>,<number>");
      setAwaitingExtraDetails(true);
      setBotTyping(false);
      return; // Wait for user's input
    }

    setBotTyping(true);
    const token = localStorage.getItem("token");
    try {
      const location = conversationContext.location;
      const num_leads = conversationContext.num_leads;
      const response = await axios.post(
        'http://127.0.0.1:8000/api/chat/',
        {
          user_input: "", // No extra message; using context parameters
          context: conversationContext,
          active_lead: supplierInfo,
          location: location,
          num_leads: num_leads,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      if (response.data?.leads) {
        setLeads(response.data.leads);
        addBotMessage("Leads generated successfully and updated in the sidebar. Type 'save' to confirm.");
      } else if (response.data?.message) {
        processBotResponse(response.data, setChatHistory, setConversationContext);
      }
    } catch (error) {
      console.error("Lead Generation API Error:", error);
      handleError(error);
    }
    setBotTyping(false);
  };

  // Error handler for API errors
  const handleError = (error) => {
    if (error.response) {
      addBotMessage(`Server error: ${error.response.data.message || "Please try again later."}`);
    } else if (error.request) {
      addBotMessage("No response from server. Check your internet connection.");
    } else {
      addBotMessage("Unexpected error occurred. Please try again.");
    }
  };

  // Helper function to add a bot message to the chat history
  const addBotMessage = (message) => {
    setChatHistory(prev => [...prev, createBotMessage(message, [])]);
  };

  // Handler when a company (supplier) is selected from the sidebar
  const handleCompanySelect = (company) => {
    // Trigger lead generation, which will prompt for extra details.
    generateLeads(company);
  };

  // Function to start a new chat (clear chat history)
  const handleNewChat = () => {
    setChatHistory([]);
  };

  return (
    <div className="chat-app">
      <CompanySidebar 
        onCompanySelect={handleCompanySelect} 
        initialSelected={companyDetails}
        leads={savedLeads.length > 0 ? savedLeads : leads}  // Show saved leads if available
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
            suggestions={suggestions}
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
      
      {/* Home Button in the top-right corner */}
      <button 
        className="home-button" 
        onClick={() => window.location.href = '/home'}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Home
      </button>
    </div>
  );
};

export default Chatbot;
