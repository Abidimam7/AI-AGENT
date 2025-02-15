import React, { useEffect, useRef } from 'react';
import { Box, Avatar, Typography, Paper, Grid } from '@mui/material';

const ChatMessages = ({ chatHistory, botTyping, suggestions, setUserInput, chatEndRef }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, botTyping]);

  return (
    <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
      {chatHistory.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Suggestions
          </Typography>
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
              <Typography variant="body1">{msg.message}</Typography>
            </Paper>
          </Box>
        ))
      )}

      {botTyping && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
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
