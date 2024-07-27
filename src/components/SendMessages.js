import React, { useState, useEffect } from 'react';
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

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const GREENAPI_ID = '7103957095';
const GREENAPI_APITOKENINSTANCE = '3d5b3813c614437baea72c0e825205f22d19bf84baf34365a8';

const SendMessages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCustomer, selectedProperty, eligibleCustomers, matchingProperties } = location.state || {};

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

  useEffect(() => {
    console.log("Current location.state:", location.state);
    
    if (!location.state) {
      console.error("No state passed to SendMessages component");
      setError("לא התקבלו נתונים. אנא חזור לדף הקודם ונסה שוב.");
      return;
    }

    if (!selectedProperty) {
      console.error("Missing selectedProperty in SendMessages component");
      setError("לא נבחר נכס. אנא חזור לדף הנכסים ובחר נכס.");
      return;
    }

    // טיפול במקרה של לקוח בודד או מערך לקוחות
    const customers = selectedCustomer ? [selectedCustomer] : (eligibleCustomers || []);

    if (customers.length === 0) {
      console.error("No customers available in SendMessages component");
      setError("לא נמצאו לקוחות מתאימים לנכס זה.");
      return;
    }

    // אם הגענו לכאן, כל הנתונים תקינים
    setSelectedCustomers(customers.map(customer => customer.id));
    setDataReady(true);
  }, [selectedCustomer, selectedProperty, eligibleCustomers, location.state]);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const replaceTokens = (message, customer) => {
    const tokens = {
      '{שם_פרטי}': customer.First_name,
      '{שם_משפחה}': customer.Last_name,
      '{תקציב}': customer.Budget,
      '{אזור}': customer.Area,
      '{מחיר_נכס}': selectedProperty.price,
      '{עיר_נכס}': selectedProperty.city,
      '{רחוב_נכס}': selectedProperty.street,
      '{מספר_חדרים}': selectedProperty.rooms,
      '{מר}': selectedProperty.square_meters,
      '{קומה}': selectedProperty.floor
    };

    return message.replace(/\{.*?\}/g, match => tokens[match] || match);
  };

  const handleSendMessages = async () => {
    setOpenConfirmDialog(false);
    setLoading(true);
    setProgress(0);
    setBackgroundSending(true);
    const totalCustomers = selectedCustomers.length;

    const sendMessagesInBackground = async () => {
      for (let i = 0; i < totalCustomers; i++) {
        try {
          const customerId = selectedCustomers[i];
          const customer = (selectedCustomer ? [selectedCustomer] : eligibleCustomers).find(c => c.id === customerId);
          const personalizedMessage = replaceTokens(customMessage, customer);
          const chatId = `972${customer.Cell}@c.us`;

          const response = await fetch(`https://api.green-api.com/waInstance${GREENAPI_ID}/sendMessage/${GREENAPI_APITOKENINSTANCE}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              chatId,
              message: personalizedMessage
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(`Error: ${data.error}`);
          }

          setProgress(((i + 1) / totalCustomers) * 100);

          if (i < totalCustomers - 1) {
            setCountdown(30);
            setOpenCountdownDialog(true);
            for (let j = 30; j > 0; j--) {
              await delay(1000);
              setCountdown(j - 1);
            }
            setOpenCountdownDialog(false);
          }
        } catch (err) {
          console.error(`Error sending message: ${err.message}`);
          setError(`שגיאה בשליחת ההודעה: ${err.message}`);
        }
      }

      setOpenSnackbar(true);
      setLoading(false);
      setProgress(0);
      setBackgroundSending(false);
      setOpenNavigationDialog(true);
    };

    sendMessagesInBackground();
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleNavigate = (destination) => {
    setOpenNavigationDialog(false);
    navigate(destination);
  };

  const handleCancelSending = () => {
    setLoading(false);
    setBackgroundSending(false);
    setProgress(0);
    setOpenCountdownDialog(false);
  };

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
              עבור נכס: {selectedProperty.city}, {selectedProperty.street}
            </Typography>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SMCustomerList 
              eligibleCustomers={selectedCustomer ? [selectedCustomer] : eligibleCustomers}
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
              האם אתה בטוח שברצונך לשלוח הודעות ל-{selectedCustomers.length} לקוחות?
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