// frontend/src/components/Chatbot/chatHelpers.js
export const createBotMessage = (message, sources) => ({
  type: 'bot',
  message,
  sources,
  timestamp: new Date().toISOString(),
});

export const processBotResponse = (data, setChatHistory, setConversationContext, typeSpeed = 30) => {
  setConversationContext(prev => ({ ...prev, ...(data.context || {}) }));
  startTypewriterEffect(data.message, data.sources || [], setChatHistory, typeSpeed);
};

export const startTypewriterEffect = (fullMessage, sources, setChatHistory, speed = 30) => {
  let index = 0;
  let currentMessage = '';

  // Add an initial empty bot message to the chat history
  setChatHistory(prev => [...prev, createBotMessage('', sources)]);

  const intervalId = setInterval(() => {
    if (index < fullMessage.length) {
      currentMessage += fullMessage[index];
      // Replace the last message with the updated one
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = createBotMessage(currentMessage, sources);
        return newHistory;
      });
      index++;
    } else {
      clearInterval(intervalId);
    }
  }, speed);

  // Cleanup function if needed
  return () => clearInterval(intervalId);
};
