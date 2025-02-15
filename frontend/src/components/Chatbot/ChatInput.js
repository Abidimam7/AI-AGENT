// frontend/src/components/Chatbot/ChatInput.js
import React from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const ChatInput = ({ userInput, setUserInput, handleSubmit, isSending }) => {
  const handleKeyDown = (e) => {
    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        bgcolor: 'background.paper',
        borderRadius: '25px',
        boxShadow: 2,
      }}
    >
      <TextField
        multiline
        placeholder="Type your message..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={handleKeyDown}
        variant="outlined"
        fullWidth
        InputProps={{
          sx: { borderRadius: '25px' },
        }}
      />
      <IconButton type="submit" color="primary" disabled={isSending} sx={{ ml: 1 }}>
        <KeyboardArrowUpIcon />
      </IconButton>
    </Box>
  );
};

export default ChatInput;
