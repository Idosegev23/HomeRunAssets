import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  CircularProgress, 
  Box,
  Card,
  CardContent,
  useMediaQuery,
  CssBaseline,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox
} from '@mui/material';
 import { styled, useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  People as PeopleIcon, 
  Message as MessageIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import Button from '@mui/material/Button';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create RTL theme
let theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Heebo, Arial, sans-serif',
  },
});
theme = responsiveFontSizes(theme);

// Custom styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  color: theme.palette.text.primary,
  background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
  },
}));

const CounterTypography = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '20px',
  padding: theme.spacing(1, 4),
  fontSize: '1rem',
  textTransform: 'none',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const ConstructionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  color: theme.palette.text.primary,
  background: `repeating-linear-gradient(
    45deg,
    ${theme.palette.background.paper},
    ${theme.palette.background.paper} 10px,
    ${theme.palette.background.default} 10px,
    ${theme.palette.background.default} 20px
  )`,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
  opacity: 0.6,
  position: 'relative',
}));

const ConstructionLabel = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  backgroundColor: '#ffcc00',
  color: '#000',
  padding: theme.spacing(0.5, 2),
  fontSize: '1rem',
  fontWeight: 'bold',
  transform: 'rotate(10deg) translate(20px, -10px)',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
}));

const AnimatedCard = motion(Card);

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const QuoteTypography = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontStyle: 'italic',
  marginBottom: theme.spacing(4),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.background.paper,
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
}));

const TaskCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const TaskCardContent = styled(CardContent)({
  flexGrow: 1,
  overflow: 'auto',
});

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [properties, setProperties] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState({
    properties: true,
    customers: true,
    messages: true
  });
  const [growthData, setGrowthData] = useState(null);
  const [quoteOfDay, setQuoteOfDay] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const chartRef = useRef(null);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get('https://home-run-assets.vercel.app/api/dataHandler', { params: { resource: 'properties' } });
      console.log('Properties fetched:', response.data);
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setSnackbarMessage('שגיאה בטעינת נכסים');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(prev => ({ ...prev, properties: false }));
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('https://home-run-assets.vercel.app/api/dataHandler', { params: { resource: 'customers' } });
      console.log('Customers fetched:', response.data);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setSnackbarMessage('שגיאה בטעינת לקוחות');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await axios.get('https://home-run-assets.vercel.app/api/dataHandler', { params: { resource: 'messages/unread' } });
      console.log('Unread messages count:', response.data);
      setUnreadMessages(response.data.count);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      setSnackbarMessage('שגיאה בטעינת הודעות לא נקראות');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get('https://home-run-assets.vercel.app/api/dataHandler', { params: { resource: 'tasks' } });
      console.log('Tasks fetched:', response.data);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setSnackbarMessage('שגיאה בטעינת משימות');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchCustomers();
    fetchUnreadMessages();
    fetchTasks();

    // Simulated growth data (replace with real data in production)
    setGrowthData({
      labels: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני'],
      datasets: [
        {
          label: 'נכסים',
          data: [12, 19, 3, 5, 2, 3],
          borderColor: theme.palette.primary.main,
          tension: 0.1,
        },
        {
          label: 'לקוחות',
          data: [1, 2, 5, 3, 2, 4],
          borderColor: theme.palette.secondary.main,
          tension: 0.1,
        },
      ],
    });

    // ציטוטים מעוררי השראה בעברית
    const quotes = [
      "הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו. - פיטר דרוקר",
      "ההצלחה היא לא המפתח לאושר. האושר הוא המפתח להצלחה. - אלברט שווייצר",
      "אל תשפוט כל יום לפי מה שקצרת, אלא לפי הזרעים שזרעת. - רוברט לואיס סטיבנסון",
      "ההזדמנות הגדולה ביותר שלך להצליח נמצאת במקום שבו אתה נמצא עכשיו. - נפוליאון היל",
      "אל תפחד מהשינוי. אתה עלול לאבד משהו טוב, אבל אתה עלול לזכות במשהו טוב יותר. - עידו מור",
    ];
    setQuoteOfDay(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [theme.palette.primary.main, theme.palette.secondary.main]);

  const handleTaskToggle = async (taskId) => {
    try {
      await axios.put('https://home-run-assets.vercel.app/api/dataHandler', { resource: 'tasks', id: taskId, data: { completed: true } });
      setTasks(tasks.filter(task => task.id !== taskId));
      setSnackbarMessage('המשימה הושלמה בהצלחה');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error completing task:', error);
      setSnackbarMessage('שגיאה בהשלמת המשימה');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'חודשים',
        },
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'כמות',
        },
      },
    },
  };

  if (loading.properties || loading.customers || loading.messages) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ flexGrow: 1, p: 3, fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
            מערכת ניהול נדל"ן
          </Typography>
          
          <QuoteTypography align="center">
            <LightbulbIcon sx={{ fontSize: '2rem', verticalAlign: 'middle', marginRight: 1 }} />
            {quoteOfDay}
          </QuoteTypography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <AnimatedCard variants={cardVariants} initial="hidden" animate="visible">
                <CardContent>
                  <HomeIcon fontSize="large" color="primary" />
                  <CounterTypography>{properties.length}</CounterTypography>
                  <Typography variant="h6">נכסים</Typography>
                  <StyledButton
                    aria-label="צפה בנכסים"
                    variant="contained"
                    color="primary"
                    component={RouterLink}
                    to="/properties"
                    startIcon={<HomeIcon />}
                  >
                    צפה בנכסים
                  </StyledButton>
                </CardContent>
              </AnimatedCard>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <AnimatedCard variants={cardVariants} initial="hidden" animate="visible">
                <CardContent>
                  <PeopleIcon fontSize="large" color="secondary" />
                  <CounterTypography>{customers.length}</CounterTypography>
                  <Typography variant="h6">לקוחות</Typography>
                  <StyledButton
                    aria-label="צפה בלקוחות"
                    variant="contained"
                    color="secondary"
                    component={RouterLink}
                    to="/customers"
                    startIcon={<PeopleIcon />}
                  >
                    צפה בלקוחות
                  </StyledButton>
                </CardContent>
              </AnimatedCard>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <AnimatedCard variants={cardVariants} initial="hidden" animate="visible">
                <CardContent>
                  <MessageIcon fontSize="large" color="info" />
                  <CounterTypography>{unreadMessages}</CounterTypography>
                  <Typography variant="h6">הודעות חדשות</Typography>
                  <StyledButton
                    aria-label="צפה בהודעות חדשות"
                    variant="contained"
                    color="info"
                    component={RouterLink}
                    to="/incoming-messages"
                    startIcon={<MessageIcon />}
                  >
                    צפה בהודעות חדשות
                  </StyledButton>
                </CardContent>
              </AnimatedCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TaskCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <AssignmentIcon sx={{ verticalAlign: 'middle', marginRight: 1 }} />
                    משימות
                  </Typography>
                  <TaskCardContent>
                    {loadingTasks ? (
                      <CircularProgress />
                    ) : tasks.length > 0 ? (
                      <List>
                        {tasks.map((task) => (
                          <ListItem key={task.id} dense button onClick={() => handleTaskToggle(task.id)}>
                            <ListItemIcon>
                              <Checkbox
                                edge="start"
                                checked={false}
                                tabIndex={-1}
                                disableRipple
                              />
                            </ListItemIcon>
                            <ListItemText primary={task.description} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography>אין משימות פעילות כרגע</Typography>
                    )}
                  </TaskCardContent>
                </CardContent>
              </TaskCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledPaper sx={{ opacity: 0.5, position: 'relative', height: '100%' }}>
                <ConstructionLabel>בבנייה</ConstructionLabel>
                <Typography variant="h6" gutterBottom>
                  <TrendingUpIcon /> מגמת צמיחה
                </Typography>
                <Box sx={{ height: 300 }}>
                  {growthData && (
                    <Line
                      ref={chartRef}
                      data={growthData}
                      options={chartOptions}
                    />
                  )}
                </Box>
              </StyledPaper>
            </Grid>
          </Grid>
        </Box>
        
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default Home;