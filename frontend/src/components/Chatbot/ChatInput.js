import React from 'react';

const ChatInput = ({ userInput, setUserInput, handleSubmit }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-wrapper">
        <textarea 
          className="chat-input"
          placeholder="Ask about lead details..."
          value={userInput}
          onChange={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
            setUserInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button type="submit" className="send-button">
          <svg className="send-icon" viewBox="0 0 24 24">
            <path d="M3 20V4l19 8-19 8Zm2-3 11.85-5L5 7v5.5l6 1.5-6 1.5V17Z"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatInput;