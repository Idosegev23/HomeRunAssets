import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Grid, Typography, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Button, AppBar, Toolbar, CircularProgress, Paper, List, ListItem, Divider, Checkbox, FormControlLabel } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import MessageEditor from './MessageEditor.js';
import './SendMessages.css';
import { useMessageContext } from '../context/MessageContext.js';
import { isHoliday } from '../utils/israeliHolidays.js';

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const DAILY_MESSAGE_LIMIT = 200;

const SendMessages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCustomer, selectedProperties, eligibleCustomers } = location.state || {};
  const { state: messageState, dispatch } = useMessageContext();

  const [customMessage, setCustomMessage] = useState('');
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openNavigationDialog, setOpenNavigationDialog] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [overrideTimeRestriction, setOverrideTimeRestriction] = useState(false);
  const [openTimeOverrideDialog, setOpenTimeOverrideDialog] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  const cachedEligibleCustomers = useMemo(() => {
    return selectedCustomer ? [selectedCustomer] : (eligibleCustomers || []);
  }, [selectedCustomer, eligibleCustomers]);

  useEffect(() => {
    if (!location.state) {
      setError("לא התקבלו נתונים. אנא חזור לדף הקודם ונסה שוב.");
      return;
    }

    if (!selectedProperties || selectedProperties.length === 0) {
      setError("לא נבחרו נכסים. אנא חזור לדף הנכסים ובחר נכסים.");
      return;
    }

    const customers = cachedEligibleCustomers;

    if (customers.length === 0) {
      setError("לא נמצאו לקוחות מתאימים לנכסים אלו.");
      return;
    }

    setSelectedCustomers(customers.map(customer => customer.id));
    setDataReady(true);
  }, [location.state, selectedProperties, cachedEligibleCustomers]);

  const handleCustomerToggle = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAllCustomers = () => {
    setSelectedCustomers(cachedEligibleCustomers.map(customer => customer.id));
  };

  const handleDeselectAllCustomers = () => {
    setSelectedCustomers([]);
  };

  const replaceTokens = useCallback((message, customer, properties) => {
    let finalMessage = message;
    properties.forEach((property, index) => {
      const tokens = {
        '{שם_פרטי}': customer.First_name,
        '{שם_משפחה}': customer.Last_name,
        '{תקציב}': customer.Budget,
        '{אזור}': customer.Area,
        [`{מחיר_נכס_${index+1}}`]: property.price,
        [`{עיר_נכס_${index+1}}`]: property.city,
        [`{רחוב_נכס_${index+1}}`]: property.street,
        [`{מספר_חדרים_${index+1}}`]: property.rooms,
        [`{מר_${index+1}}`]: property.square_meters,
        [`{קומה_${index+1}}`]: property.floor
      };

      Object.entries(tokens).forEach(([token, value]) => {
        finalMessage = finalMessage.replace(new RegExp(token, 'g'), value);
      });
    });
    console.log("Final message after token replacement:", finalMessage);
    return finalMessage;
  }, []);

  const isWithinAllowedTime = useCallback(() => {
    if (overrideTimeRestriction) {
      return true;
    }

    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();
    const holiday = isHoliday(now);

    if (holiday || day === 6 || (day === 5 && hours >= 14) || hours >= 20 || hours < 8) {
      return false;
    }
    return true;
  }, [overrideTimeRestriction]);

  const handleSendMessages = useCallback(() => {
    setOpenConfirmDialog(false);

    const totalCustomers = selectedCustomers.length;

    if (messageState.dailyMessageCount >= DAILY_MESSAGE_LIMIT) {
      setError("כמות ההודעות המקסימלית להיום הושגה. ניתן לשלוח הודעות נוספות מחר.");
      setOpenSnackbar(true);
      return;
    }

    if (!isWithinAllowedTime()) {
      setOpenTimeOverrideDialog(true);
      return;
    }

    const messagesToSend = selectedCustomers.map(customerId => {
      const customer = cachedEligibleCustomers.find(c => c.id === customerId);
      console.log("Customer:", customer);
      console.log("Selected Properties:", selectedProperties);
      const personalizedMessage = replaceTokens(customMessage, customer, selectedProperties);
      console.log("Personalized message:", personalizedMessage);
      return {
        customer,
        message: personalizedMessage,
        property: selectedProperties
      };
    });

    dispatch({ type: 'ADD_TO_QUEUE', payload: messagesToSend });
    dispatch({ type: 'SET_TOTAL_MESSAGES', payload: messagesToSend.length });
    dispatch({ type: 'START_SENDING' });

    setOpenSnackbar(true);
    setOpenNavigationDialog(true);
  }, [selectedCustomers, messageState.dailyMessageCount, cachedEligibleCustomers, customMessage, selectedProperties, dispatch, replaceTokens, isWithinAllowedTime]);

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const handleNavigate = useCallback((destination) => {
    setOpenNavigationDialog(false);
    navigate(destination);
  }, [navigate]);

  const handleTimeOverride = useCallback((override) => {
    setOverrideTimeRestriction(override);
    setOpenTimeOverrideDialog(false);
    if (override) {
      handleSendMessages();
    }
  }, [handleSendMessages]);

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6" align="center">
          {error}
        </Typography>
        <Button onClick={() => navigate('/properties')} variant="contained" color="primary" style={{ marginTop: '20px' }}>
          חזור לדף הנכסים
        </Button>
      </Container>
    );
  }

  if (!dataReady) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <CacheProvider value={cacheRtl}>
      <Container maxWidth="lg" className="send-messages-container">
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              שליחת הודעות
            </Typography>
          </Toolbar>
        </AppBar>

        <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" align="center" gutterBottom>
                שליחת הודעות ללקוחות
              </Typography>
              <Typography variant="h6" align="center" gutterBottom>
                עבור נכסים נבחרים
              </Typography>
              <Typography variant="subtitle1" align="center" gutterBottom>
                סה"כ הודעות שנשלחו היום: {messageState.dailyMessageCount} / {DAILY_MESSAGE_LIMIT}
              </Typography>
              <Typography variant="subtitle1" align="center" gutterBottom>
                ניתן לשלוח עוד {DAILY_MESSAGE_LIMIT - messageState.dailyMessageCount} הודעות היום
              </Typography>
            </Grid>
          </Grid>
        
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  לקוחות נבחרים
                </Typography>
                <Button onClick={handleSelectAllCustomers}>בחר הכל</Button>
                <Button onClick={handleDeselectAllCustomers}>בטל בחירת הכל</Button>
                {cachedEligibleCustomers.length > 0 ? (
                  <List>
                    {cachedEligibleCustomers.map((customer) => (
                      <React.Fragment key={customer.id}>
                        <ListItem>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedCustomers.includes(customer.id)}
                                onChange={() => handleCustomerToggle(customer.id)}
                              />
                            }
                            label={`${customer.First_name} ${customer.Last_name} - ${customer.Cell}`}
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography>אין לקוחות זמינים</Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <MessageEditor 
                  customMessage={customMessage}
                  setCustomMessage={setCustomMessage}
                  loading={messageState.sending}
                  backgroundSending={messageState.sending}
                  progress={messageState.progress}
                  selectedCustomers={selectedCustomers}
                  handleSendMessages={() => setOpenConfirmDialog(true)}
                  handleCancelSending={() => dispatch({ type: 'STOP_SENDING' })}
                />
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={error ? "error" : "success"}>
            {error || "ההודעות נוספו לתור השליחה בהצלחה!"}
          </Alert>
        </Snackbar>
        
        <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
          <DialogTitle>אישור שליחת הודעות</DialogTitle>
          <DialogContent>
            <Typography>
              האם אתה בטוח שברצונך לשלוח הודעות ל-{selectedCustomers.length} לקוחות עבור {selectedProperties.length} נכסים נבחרים?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirmDialog(false)}>
              ביטול
            </Button>
            <Button onClick={() => handleSendMessages()} color="primary">
              אישור
            </Button>
          </DialogActions>
        </Dialog>
        
        <Dialog open={openNavigationDialog} onClose={() => setOpenNavigationDialog(false)}>
          <DialogTitle>לאן תרצה לנווט?</DialogTitle>
          <DialogContent>
            <Button onClick={() => handleNavigate('/properties')}>דף נכסים</Button>
            <Button onClick={() => handleNavigate('/customers')}>דף לקוחות</Button>
            <Button onClick={() => handleNavigate('/')}>דף הבית</Button>
            <Button onClick={() => handleNavigate('/chat')}>דף צ'אט</Button>
            <Button onClick={() => handleNavigate('/message-queue')}>תור הודעות</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={openTimeOverrideDialog} onClose={() => handleTimeOverride(false)}>
          <DialogTitle>שליחת הודעות מחוץ לשעות המותרות</DialogTitle>
          <DialogContent>
            <Typography>
              השעה הנוכחית היא מחוץ לשעות המותרות לשליחת הודעות. האם ברצונך להמשיך בכל זאת?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleTimeOverride(false)} color="primary">
              ביטול
            </Button>
            <Button onClick={() => handleTimeOverride(true)} color="secondary">
              המשך שליחה
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </CacheProvider>
  );
};

export default SendMessages;