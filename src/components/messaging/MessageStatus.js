import React from 'react';
import { useMessageContext } from '../../context/MessageContext';
import { Paper, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const MessageStatus = () => {
  const { state } = useMessageContext();
  const navigate = useNavigate();

  if (state.queue.length === 0 && !state.sending) return null;

  return (
    <Paper 
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        padding: 2,
        width: 250,
        zIndex: 1000
      }}
    >
      <Typography variant="h6" gutterBottom>סטטוס הודעות</Typography>
      <Typography variant="body2">
        {state.sending ? 'שולח הודעות' : 'ממתין לשליחה'}
      </Typography>
      <Typography variant="body2">
        הודעות בתור: {state.queue.length}
      </Typography>
      <Box mt={2}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/message-queue')}
          fullWidth
        >
          נהל תור הודעות
        </Button>
      </Box>
    </Paper>
  );
};

export default MessageStatus;