import { Box, Typography, Button } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import CompanySidebar from "../../components/Sidebar/CompanySidebar";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { createBotMessage, processBotResponse } from "./chatHelpers";
import "./Chatbot.css";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

const drawerWidth = 240;
const baseUrl = process.env.REACT_APP_API_BASE_URL;

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [activeLead, setActiveLead] = useState(null);
  const [botTyping, setBotTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState({});
  const [companyDetails, setCompanyDetails] = useState(null);
  const [leads, setLeads] = useState([]);
  const [savedLeads, setSavedLeads] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [awaitingExtraDetails, setAwaitingExtraDetails] = useState(false);

  const chatEndRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Helper function to generate a Markdown table from leads
  const generateMarkdownTable = (leads) => {
    let table = `| # | Company | Email | Phone | Address |\n`;
    table += `|---|---------|-------|-------|---------|\n`;
    leads.forEach((lead, index) => {
      table += `| ${index + 1} | ${lead.company_name} | ${lead.email} | ${lead.phone} | ${lead.address} |\n`;
    });
    return table;
  };

  useEffect(() => {
    const savedDetails = sessionStorage.getItem("companyDetails");
    if (savedDetails) {
      setCompanyDetails(JSON.parse(savedDetails));
    }
  
    const storedSavedLeads = localStorage.getItem("savedLeads");
    if (storedSavedLeads) {
      setSavedLeads(JSON.parse(storedSavedLeads));
    }
  
    const storedChatHistory = localStorage.getItem("chatHistory");
    if (storedChatHistory) {
      setChatHistory(JSON.parse(storedChatHistory));
    }
  
    const storedLeads = localStorage.getItem("leads");
    if (storedLeads) {
      setLeads(JSON.parse(storedLeads));
    }
  }, []);
  
  // Persist chatHistory to localStorage
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);
  
  // Persist leads to localStorage
  useEffect(() => {
    localStorage.setItem("leads", JSON.stringify(leads));
  }, [leads]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return;
    sendUserMessage(userInput);
  };

  const sendUserMessage = async (message) => {
    if (message.trim().toLowerCase() === "save" && leads.length > 0) {
      setUserInput("");
      const token = localStorage.getItem("token");
      try {
        const payload = {
          supplier_id: activeLead ? activeLead.id : null,
          leads: leads.map((lead) => ({
            ...lead,
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
      setLeads([]);
      return;
    }

    if (activeLead && awaitingExtraDetails) {
      setUserInput("");
      const parts = message.split(",");
      if (parts.length >= 2) {
        const location = parts[0].trim();
        const num_leads = parts[1].trim();
        setConversationContext((prev) => ({ ...prev, location, num_leads }));
        addBotMessage(
          `Received location: ${location} and number of leads: ${num_leads}. Generating leads...`
        );
        setAwaitingExtraDetails(false);
        await generateLeads(activeLead, location, num_leads);
      } else {
        addBotMessage("Invalid format. Please provide details in the format: <location>,<number>");
      }
      return;
    }

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
        const markdownTable = generateMarkdownTable(response.data.leads);
        addBotMessage("Generated Leads:\n" + markdownTable);
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

  const generateLeads = async (supplierInfo, locationParam, numLeadsParam) => {
    setActiveLead(supplierInfo);
    const companyMessage = `Selected Supplier:
Company: ${supplierInfo.company_name}
Product: ${supplierInfo.product_name}
Description: ${supplierInfo.product_description}`;
    setChatHistory((prev) => [...prev, { type: "user", message: companyMessage }]);

    const location = locationParam || conversationContext.location;
    const num_leads = numLeadsParam || conversationContext.num_leads;

    if (!location || !num_leads) {
      addBotMessage("Please provide the location and number of leads to generate, in the format: <location>,<number>");
      setAwaitingExtraDetails(true);
      setBotTyping(false);
      return;
    }

    setBotTyping(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${baseUrl}/chat/`,
        {
          user_input: "",
          context: { ...conversationContext, location, num_leads },
          active_lead: supplierInfo,
          location: location,
          num_leads: num_leads,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      if (response.data?.leads) {
        setLeads(response.data.leads);
        const markdownTable = generateMarkdownTable(response.data.leads);
        addBotMessage("Generated Leads:\n" + markdownTable);
      } else if (response.data?.message) {
        processBotResponse(response.data, setChatHistory, setConversationContext);
      }
    } catch (error) {
      console.error("Lead Generation API Error:", error);
      handleError(error);
    }
    setBotTyping(false);
  };

  const handleError = (error) => {
    if (error.response) {
      addBotMessage(`Server error: ${error.response.data.message || "Please try again later."}`);
    } else if (error.request) {
      addBotMessage("No response from server. Check your internet connection.");
    } else {
      addBotMessage("Unexpected error occurred. Please try again.");
    }
  };

  // Ensure createBotMessage includes 'type: "bot"' in returned object
  const addBotMessage = (message) => {
    setChatHistory((prev) => [...prev, { type: "bot", message }]);
  };

  const handleCompanySelect = (company) => {
    generateLeads(company);
  };

  const handleNewChat = () => {
    localStorage.removeItem("chatHistory");
    localStorage.removeItem("leads");
    setChatHistory([]);
    setConversationContext({});
    setActiveLead(null);
    setLeads([]);
  };

  // Rest of the component remains the same...
  return (
    <Box sx={{ display: "flex" }}>
      <CompanySidebar
        onCompanySelect={handleCompanySelect}
        initialSelected={companyDetails}
        onGenerateLeads={() => activeLead && generateLeads(activeLead)}
        onNewChat={handleNewChat}
      />

      <Box
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : `${drawerWidth}px`,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.default",
        }}
      >
        <Box
          sx={{
            p: 1,
            borderBottom: "1px solid #ddd",
            textAlign: "center",
          }}
        >
          <Typography variant="h5">Lead Generation Assistant</Typography>
          <Typography variant="subtitle1">
            AI‑powered lead research and analysis
          </Typography>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 2,
            px: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 900,
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                px: 2,
                py: 2,
                borderRadius: 2,
              }}
            >
              <ChatMessages
                chatHistory={chatHistory}
                botTyping={botTyping}
                chatEndRef={chatEndRef}
              />
            </Box>

            <Box
              sx={{
                borderTop: "1px solid #ddd",
                p: 2,
                backgroundColor: "background.paper",
                position: "sticky",
                bottom: 0,
              }}
            >
              <ChatInput
                userInput={userInput}
                setUserInput={setUserInput}
                handleSubmit={handleSubmit}
                isSending={isSending}
              />
            </Box>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={() => (window.location.href = "/home")}
          sx={{
            position: "fixed",
            top: 16,
            right: 16,
          }}
        >
          HOME
        </Button>
      </Box>
    </Box>
  );
};

export default Chatbot;