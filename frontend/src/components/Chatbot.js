import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CompanySidebar from './CompanySidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { createBotMessage, processBotResponse } from './chatHelpers';
import './Chatbot.css';

const Chatbot = () => {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [activeLead, setActiveLead] = useState(null); // This will store supplier info for lead generation.
  const [botTyping, setBotTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState({});
  const [companyDetails, setCompanyDetails] = useState(null);
  const [leads, setLeads] = useState([]); // New state to hold generated leads.
  const [isSending, setIsSending] = useState(false); // Prevent multiple submissions
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

  // Function to handle regular chat messages
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return; // Prevent empty and multiple submissions
    sendUserMessage(userInput);
  };

  // Regular chat message sending (without lead generation)
  const sendUserMessage = async (message) => {
    const userMessage = { type: 'user', message };
    setChatHistory(prev => [...prev, userMessage]);
    setUserInput('');
    setBotTyping(true);
    setIsSending(true); // Disable input while sending

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat/', {
        user_input: message,
        context: conversationContext,
        active_lead: activeLead  // This is normally null unless lead generation is triggered.
      });

      // Check if the response contains leads (from supplier info)
      if (response.data?.leads) {
        setLeads(response.data.leads);
        addBotMessage("Leads generated successfully and updated in the sidebar.");
      } else if (response.data?.message) {
        processBotResponse(response.data, setChatHistory, setConversationContext);
      }
    } catch (error) {
      console.error("API Error:", error);
      handleError(error);
    }

    setBotTyping(false);
    setIsSending(false); // Re-enable input
  };

  // New function to generate leads based on supplier info (from sidebar selection)
  const generateLeads = async (supplierInfo) => {
    // Set the activeLead to the supplier info
    setActiveLead(supplierInfo);

    // Optionally add a chat message indicating that lead generation has started.
    addBotMessage("Generating leads for the selected supplier...");

    setBotTyping(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat/', {
        user_input: "",  // No chat text needed; supplier info is passed in active_lead.
        context: conversationContext,
        active_lead: supplierInfo
      });

      if (response.data?.leads) {
        setLeads(response.data.leads);
        addBotMessage("Leads generated successfully and updated in the sidebar.");
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

  // Update the company selection handler to trigger lead generation.
  const handleCompanySelect = (company) => {
    // Save the supplier info as activeLead and trigger lead generation.
    generateLeads(company);

    // Optionally, you may want to add this info to the chat history.
    const companyMessage = `Selected Supplier:\nCompany: ${company.company_name}\nProduct: ${company.product_name}\nDescription: ${company.product_description}`;
    setChatHistory(prev => [
      ...prev,
      { type: 'user', message: companyMessage }
    ]);
  };
  const handleNewChat = () => {
    // Clear chat history or reset chat state
    setChatHistory([]);
  };  

  return (
    <div className="chat-app">
      <CompanySidebar 
        onCompanySelect={handleCompanySelect} 
        initialSelected={companyDetails}
        leads={leads}  // List of generated leads
        onGenerateLeads={generateLeads}  // Callback to generate leads
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
            isSending={isSending} // Disable input when sending
          />
        </div>
      </div>
    </div>
  );
};

// Typing Effect for AI responses
const TypingEffect = ({ message }) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < message.length) {
      const timeout = setTimeout(() => {
        setDisplayedMessage(prev => prev + message[index]);
        setIndex(index + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [index, message]);

  return <span>{displayedMessage}</span>;
};

export default Chatbot;
