import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Grid, Typography, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Button, AppBar, Toolbar, CircularProgress } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import SMCustomerList from './SMCustomerList';
import MessageEditor from './MessageEditor';
import './SendMessages.css';
import axios from 'axios';
import { isHoliday, getHolidayName } from '../utils/israeliHolidays';

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const DAILY_MESSAGE_LIMIT = 200;
const WAIT_TIME = 20 * 1000; // 20 seconds

const SendMessages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCustomer, selectedProperties, eligibleCustomers } = location.state || {};

  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backgroundSending, setBackgroundSending] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openNavigationDialog, setOpenNavigationDialog] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [openCountdownDialog, setOpenCountdownDialog] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [sendQueue, setSendQueue] = useState([]);
  const [dailyMessageCount, setDailyMessageCount] = useState(() => {
    const storedCount = localStorage.getItem('dailyMessageCount');
    return storedCount ? parseInt(storedCount, 10) : 0;
  });
  const [totalMessages, setTotalMessages] = useState(() => {
    const storedTotal = localStorage.getItem('totalMessages');
    return storedTotal ? parseInt(storedTotal, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('dailyMessageCount', dailyMessageCount.toString());
  }, [dailyMessageCount]);

  useEffect(() => {
    localStorage.setItem('totalMessages', totalMessages.toString());
  }, [totalMessages]);

  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    const resetMessageCount = () => {
      setDailyMessageCount(0);
      localStorage.setItem('dailyMessageCount', '0');
    };

    const timeoutId = setTimeout(resetMessageCount, timeUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, []);

  const cachedEligibleCustomers = useMemo(() => {
    return selectedCustomer ? [selectedCustomer] : (eligibleCustomers || []);
  }, [selectedCustomer, eligibleCustomers]);

  useEffect(() => {
    if (!location.state) {
      console.log("No state received in location");
      setError("לא התקבלו נתונים. אנא חזור לדף הקודם ונסה שוב.");
      return;
    }

    if (!selectedProperties || selectedProperties.length === 0) {
      console.log("No properties selected");
      setError("לא נבחרו נכסים. אנא חזור לדף הנכסים ובחר נכסים.");
      return;
    }

    const customers = cachedEligibleCustomers;

    if (customers.length === 0) {
      console.log("No eligible customers found");
      setError("לא נמצאו לקוחות מתאימים לנכסים אלו.");
      return;
    }

    console.log(`Setting ${customers.length} selected customers`);
    setSelectedCustomers(customers.map(customer => customer.id));
    setDataReady(true);
  }, [location.state, selectedProperties, cachedEligibleCustomers]);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const replaceTokens = useCallback((message, customer, properties) => {
    console.log("Replacing tokens in message");
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
    console.log("Tokens replaced in message");
    return finalMessage;
  }, []);

  const isWithinAllowedTime = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();
    const holiday = isHoliday(now);

    console.log(`Checking allowed time: Hour ${hours}, Day ${day}, Holiday: ${holiday}`);

    if (holiday || day === 6 || (day === 5 && hours >= 14) || hours >= 20) {
      console.log("Outside allowed time");
      return false;
    }
    console.log("Within allowed time");
    return true;
  }, []);

  const sendMessage = useCallback(async (chatId, personalizedMessage) => {
    const retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Attempting to send message to ${chatId}, attempt ${i + 1}`);
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sendMessage`, {
          phoneNumber: chatId,
          text: personalizedMessage
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log(`Response from server:`, response);

        if (response.status === 200) {
          console.log(`Message sent successfully to ${chatId}`);
          return response.data;
        } else {
          console.error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error sending message to ${chatId}:`, error.response?.data || error.message);
        if (i === retries - 1) throw error;
        console.log(`Retrying in ${1000 * Math.pow(2, i)}ms...`);
        await delay(1000 * Math.pow(2, i)); // Exponential backoff
      }
    }
    throw new Error(`Failed to send message after ${retries} attempts`);
  }, []);

  const handleSendMessages = useCallback(async () => {
    console.log("Starting handleSendMessages");
    setOpenConfirmDialog(false);
    setLoading(true);
    setProgress(0);
    setBackgroundSending(true);

    const totalCustomers = selectedCustomers.length;
    console.log(`Total customers to process: ${totalCustomers}`);

    if (dailyMessageCount >= DAILY_MESSAGE_LIMIT) {
      console.log("Daily message limit reached");
      setError("כמות ההודעות המקסימלית להיום הושגה. ניתן לשלוח הודעות נוספות מחר.");
      setOpenSnackbar(true);
      setLoading(false);
      return;
    }

    const sendMessagesInBackground = async () => {
      console.log("Starting sendMessagesInBackground");
      for (let i = 0; i < totalCustomers; i++) {
        console.log(`Processing customer ${i + 1} of ${totalCustomers}`);
        if (!isWithinAllowedTime()) {
          console.log("Outside allowed time for sending messages");
          const holidayName = getHolidayName(new Date());
          setError(holidayName 
            ? `היום חג ישראלי (${holidayName}), ולכן לא ניתן לשלוח הודעות.` 
            : "לא ניתן לשלוח הודעות בשעה או ביום הנוכחיים. ההודעות יישלחו בזמן המתאים הבא.");
          setOpenSnackbar(true);
          break;
        }

        const customerId = selectedCustomers[i];
        const customer = cachedEligibleCustomers.find(c => c.id === customerId);
        console.log(`Preparing message for customer: ${customer.id}`);
        const personalizedMessage = replaceTokens(customMessage, customer, selectedProperties);

        const chatId = `972${customer.Cell.replace(/\D/g, '').slice(1)}@c.us`;
        console.log(`Attempting to send message to chatId: ${chatId}`);

        try {
          const result = await sendMessage(chatId, personalizedMessage);
          console.log(`Message sent successfully to ${chatId}. Result:`, result);

          setProgress(((i + 1) / totalCustomers) * 100);
          setDailyMessageCount(prevCount => {
            const newCount = prevCount + 1;
            console.log(`Updated daily message count: ${newCount}`);
            localStorage.setItem('dailyMessageCount', newCount.toString());
            return newCount;
          });
          setTotalMessages(prev => {
            const newTotal = prev + 1;
            console.log(`Updated total messages: ${newTotal}`);
            localStorage.setItem('totalMessages', newTotal.toString());
            return newTotal;
          });

          if (i < totalCustomers - 1) {
            console.log(`Starting countdown for next message`);
            setCountdown(20);
            setOpenCountdownDialog(true);
            for (let k = 20; k > 0; k--) {
              await delay(1000);
              setCountdown(k - 1);
            }
            setOpenCountdownDialog(false);
          }
        } catch (err) {
          console.error(`Error sending message to ${chatId}:`, err);
          setError(`שגיאה בשליחת ההודעה: ${err.message}`);
          setOpenSnackbar(true);
        }
      }

      console.log("Finished processing all customers");
      setOpenSnackbar(true);
      setLoading(false);
      setProgress(0);
      setBackgroundSending(false);
      setOpenNavigationDialog(true);
    };

    console.log("Adding sendMessagesInBackground to queue");
    setSendQueue(prevQueue => [...prevQueue, sendMessagesInBackground]);
  }, [selectedCustomers, dailyMessageCount, isWithinAllowedTime, cachedEligibleCustomers, customMessage, selectedProperties, sendMessage, replaceTokens]);

  const handleProcessQueue = useCallback(async () => {
    while (sendQueue.length > 0) {
      const sendTask = sendQueue.shift();
      await sendTask();
    }
  }, [sendQueue]);

  useEffect(() => {
    if (sendQueue.length > 0 && !loading) {
      console.log("Processing send queue");
      handleProcessQueue();
    }
  }, [sendQueue, loading, handleProcessQueue]);

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const handleNavigate = useCallback((destination) => {
    setOpenNavigationDialog(false);
    navigate(destination);
  }, [navigate]);

  const handleCancelSending = useCallback(() => {
    console.log("Cancelling message sending");
    setLoading(false);
    setBackgroundSending(false);
    setProgress(0);
    setOpenCountdownDialog(false);
    setSendQueue([]);
  }, []);

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
      <Container className="send-messages-container">
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              שליחת הודעות
            </Typography>
          </Toolbar>
        </AppBar>

        <Grid container spacing={3} className="header">
          <Grid item xs={12}>
            <Typography variant="h4" align="center" gutterBottom>
              שליחת הודעות ללקוחות
            </Typography>
            <Typography variant="h6" align="center" gutterBottom>
              עבור נכסים נבחרים
            </Typography>
            <Typography variant="h6" align="center" gutterBottom>
              סה"כ הודעות שנשלחו היום: {totalMessages} / {DAILY_MESSAGE_LIMIT}
            </Typography>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SMCustomerList 
              eligibleCustomers={cachedEligibleCustomers}
              selectedCustomers={selectedCustomers}
              setSelectedCustomers={setSelectedCustomers}
            />
</Grid>
          <Grid item xs={12} md={6}>
            <MessageEditor 
              customMessage={customMessage}
              setCustomMessage={setCustomMessage}
              loading={loading}
              backgroundSending={backgroundSending}
              progress={progress}
              selectedCustomers={selectedCustomers}
              handleSendMessages={() => setOpenConfirmDialog(true)}
              handleCancelSending={handleCancelSending}
            />
          </Grid>
        </Grid>
        
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={error ? "error" : "success"}>
            {error || "ההודעות נשלחו בהצלחה!"}
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
            <Button onClick={() => setOpenConfirmDialog(false)}>ביטול</Button>
            <Button onClick={handleSendMessages} color="primary">
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
          </DialogContent>
        </Dialog>

        <Dialog open={openCountdownDialog}>
          <DialogTitle>המתנה לשליחת ההודעה הבאה</DialogTitle>
          <DialogContent>
            <Typography>
              עוד {countdown} שניות לשליחה הבאה כדי שלא ייחסם הנייד
            </Typography>
          </DialogContent>
        </Dialog>
      </Container>
    </CacheProvider>
  );
};

export default SendMessages;