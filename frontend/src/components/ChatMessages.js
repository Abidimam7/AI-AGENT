import React, { useEffect, useRef } from 'react';

const ChatMessages = ({ chatHistory, botTyping, suggestions,setUserInput, chatEndRef }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, botTyping]);

  return (
    <div className="chat-messages">
      {chatHistory.length === 0 ? (
        <div className="empty-state">
          <div className="suggestions-grid">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="suggestion-card"
                onClick={() => setUserInput(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      ) : (
        chatHistory.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            {msg.type === 'bot' && (
              <div className="avatar">
                <div className="bot-icon">AI</div>
              </div>
            )}
            <div className="message-content">{msg.message}</div>
          </div>
        ))
      )}
      {botTyping && (
        <div className="message bot typing">
          <div className="avatar">
            <div className="bot-icon">AI</div>
          </div>
          <div className="typing-indicator">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;