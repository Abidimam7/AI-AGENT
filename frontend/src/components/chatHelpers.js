export const createBotMessage = (message, sources) => ({
    type: 'bot',
    message,
    sources,
    timestamp: new Date().toISOString()
  });
  
  export const processBotResponse = (data, setChatHistory, setConversationContext) => {
    setConversationContext(prev => ({ ...prev, ...(data.context || {}) }));
    startTypewriterEffect(data.message, data.sources || [], setChatHistory);
  };
  
  export const startTypewriterEffect = (fullMessage, sources, setChatHistory) => {
    let index = 0;
    let currentMessage = '';
    const intervalRef = { current: null };
  
    setChatHistory(prev => [...prev, createBotMessage('', sources)]);
  
    intervalRef.current = setInterval(() => {
      if (index < fullMessage.length) {
        currentMessage += fullMessage[index];
        setChatHistory(prev => [
          ...prev.slice(0, -1),
          createBotMessage(currentMessage, sources)
        ]);
        index++;
      } else {
        clearInterval(intervalRef.current);
      }
    }, 30);
  
    return () => clearInterval(intervalRef.current);
  };