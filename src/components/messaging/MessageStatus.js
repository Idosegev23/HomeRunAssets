import React from 'react';
import { useMessageContext } from '../../context/MessageContext';
import { Paper, Typography, LinearProgress, Box } from '@mui/material';

const MessageStatus = () => {
  const { state } = useMessageContext();

  if (!state.sending && state.queue.length === 0) return null;

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
      {state.sending ? (
        <>
          <Typography variant="body2" gutterBottom>
            שולח הודעות: {Math.round(state.progress)}%
          </Typography>
          <LinearProgress variant="determinate" value={state.progress} />
          <Box mt={1}>
            <Typography variant="caption">
              {state.totalMessages - state.queue.length} מתוך {state.totalMessages} הודעות נשלחו
            </Typography>
          </Box>
        </>
      ) : (
        <Typography variant="body2">
          הודעות בתור: {state.queue.length}
        </Typography>
      )}
    </Paper>
  );
};

export default MessageStatus;