import React, { useState } from 'react';
import { Paper, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Button, Box, CircularProgress, LinearProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send/index.js';
import SaveIcon from '@mui/icons-material/Save/index.js';
import CancelIcon from '@mui/icons-material/Cancel/index.js';
import messageTemplates from './messageTemplates.json.js';
const MessageEditor = ({ customMessage, setCustomMessage, loading, backgroundSending, progress, selectedCustomers, handleSendMessages, handleCancelSending }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleTemplateChange = (event) => {
    const template = messageTemplates.find(t => t.id === event.target.value);
    setSelectedTemplate(event.target.value);
    setCustomMessage(template ? template.content : '');
  };

  const handleCustomMessageChange = (event) => {
    setCustomMessage(event.target.value);
  };

  const handleSaveDraft = () => {
    localStorage.setItem('messageDraft', customMessage);
    // You might want to show a snackbar or some other notification here
    console.log('Draft saved');
  };

  const handleLoadDraft = () => {
    const draft = localStorage.getItem('messageDraft');
    if (draft) {
      setCustomMessage(draft);
      console.log('Draft loaded');
    } else {
      console.log('No draft found');
    }
  };

  return (
    <Paper className="message-editor-paper">
      <Typography variant="h6" gutterBottom>עריכת הודעה</Typography>
      <FormControl fullWidth variant="outlined" className="template-select">
        <InputLabel id="template-label">תבנית הודעה</InputLabel>
        <Select
          labelId="template-label"
          id="template-select"
          value={selectedTemplate}
          onChange={handleTemplateChange}
          label="תבנית הודעה"
        >
          {messageTemplates.map(template => (
            <MenuItem key={template.id} value={template.id}>
              {template.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        fullWidth
        variant="outlined"
        multiline
        rows={10}
        value={customMessage}
        onChange={handleCustomMessageChange}
        placeholder="הקלד את ההודעה כאן..."
        className="message-textarea"
      />
      <Box className="draft-actions">
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={handleSaveDraft}
        >
          שמור טיוטה
        </Button>
        <Button
          variant="outlined"
          onClick={handleLoadDraft}
        >
          טען טיוטה
        </Button>
      </Box>
      <Button
        fullWidth
        variant="contained"
        color="primary"
        startIcon={<SendIcon />}
        onClick={handleSendMessages}
        disabled={loading || backgroundSending || selectedCustomers.length === 0}
        className="send-button"
      >
        {loading ? <CircularProgress size={24} /> : 'שלח הודעות'}
      </Button>
      {(loading || backgroundSending) && (
        <Box className="progress-bar">
          <Typography variant="body2" gutterBottom>
            נשלחו {Math.round(progress)}% מההודעות ({Math.round(progress * selectedCustomers.length / 100)} מתוך {selectedCustomers.length})
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            startIcon={<CancelIcon />}
            onClick={handleCancelSending}
            className="cancel-button"
          >
            בטל שליחה
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default MessageEditor;