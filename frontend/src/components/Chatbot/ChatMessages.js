// frontend/src/components/Chatbot/ChatMessages.js
import React, { useEffect, useRef } from 'react';
import { Box, Avatar, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatMessages = ({ chatHistory, botTyping, chatEndRef }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, botTyping]);

  return (
    <Box sx={{ width: '100%' }}>
      {chatHistory.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Paper sx={{ p: 2 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              Start the conversation...
            </ReactMarkdown>
          </Paper>
        </Box>
      ) : (
        chatHistory.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              mb: 2,
              flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
            }}
          >
            {msg.type === 'bot' && (
              <Avatar sx={{ bgcolor: 'secondary.main', mr: 1 }}>AI</Avatar>
            )}
            <Paper
              sx={{
                p: 1.5,
                maxWidth: '80%',
                bgcolor: msg.type === 'user' ? 'primary.light' : 'grey.100',
              }}
            >
              {/* 
                We pass our custom table/row/cell styles through the `components` prop.
                This way, any Markdown tables in the message will be styled nicely.
              */}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ node, ...props }) => (
                    <table
                      style={{
                        borderCollapse: 'collapse',
                        width: '100%',
                        margin: '1em 0',
                      }}
                      {...props}
                    />
                  ),
                  th: ({ node, ...props }) => (
                    <th
                      style={{
                        border: '1px solid #ddd',
                        padding: '8px',
                        background: '#f9f9f9',
                        textAlign: 'left',
                      }}
                      {...props}
                    />
                  ),
                  td: ({ node, ...props }) => (
                    <td
                      style={{
                        border: '1px solid #ddd',
                        padding: '8px',
                      }}
                      {...props}
                    />
                  ),
                }}
              >
                {msg.message}
              </ReactMarkdown>
            </Paper>
          </Box>
        ))
      )}

      {botTyping && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', mr: 1 }}>AI</Avatar>
          <Paper
            sx={{
              p: 1.5,
              maxWidth: '80%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  bgcolor: 'grey.500',
                  borderRadius: '50%',
                  animation: 'blink 1s infinite',
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  bgcolor: 'grey.500',
                  borderRadius: '50%',
                  animation: 'blink 1s infinite 0.2s',
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  bgcolor: 'grey.500',
                  borderRadius: '50%',
                  animation: 'blink 1s infinite 0.4s',
                }}
              />
            </Box>
          </Paper>
        </Box>
      )}
      <Box ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessages;
