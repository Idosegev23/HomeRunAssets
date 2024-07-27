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
  ListItemText
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { 
  Home as HomeIcon, 
  People as PeopleIcon, 
  Message as MessageIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon
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

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [properties, setProperties] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState(null);
  const [quoteOfDay, setQuoteOfDay] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const chartRef = useRef(null);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesRes, customersRes] = await Promise.all([
          axios.get('http://localhost:5001/api/properties'),
          axios.get('http://localhost:5001/api/customers')
        ]);

        setProperties(propertiesRes.data);
        setCustomers(customersRes.data);
        setLoading(false);

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
          "הדרך הטובה ביותר לנבא את העתיד היא ליצור אותו. - אלן קיי",
          "אם אתה רוצה להגיע מהר, לך לבד. אם אתה רוצה להגיע רחוק, לך ביחד. - פתגם אפריקאי",
          "החיים הם 10% מה שקורה לך ו-90% איך אתה מגיב לזה. - צ'ארלס סווינדול",
          "כל הצלחה מתחילה בהחלטה לנסות. - גייל דיוורס",
          "אל תחכה. הזמן לעולם לא יהיה מושלם. - נפוליאון היל",
        ];
        setQuoteOfDay(quotes[Math.floor(Math.random() * quotes.length)]);

      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbarMessage('שגיאה בטעינת הנתונים');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
      }
    };

    fetchData();
  }, [theme.palette.primary.main, theme.palette.secondary.main]);

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

  if (loading) {
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
              <ConstructionPaper>
                <ConstructionLabel>בבנייה</ConstructionLabel>
                <CardContent>
                  <MessageIcon fontSize="large" color="info" />
                  <CounterTypography>0</CounterTypography>
                  <Typography variant="h6">הודעות חדשות</Typography>
                  <StyledButton
                    aria-label="צפה בהודעות"
                    variant="contained"
                    color="info"
                    component={RouterLink}
                    to="/building"
                    startIcon={<MessageIcon />}
                  >
                    צפה בהודעות
                  </StyledButton>
                </CardContent>
              </ConstructionPaper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StyledPaper sx={{ opacity: 0.5, position: 'relative' }}>
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
            
            <Grid item xs={12} md={6}>
              <ConstructionPaper>
                <ConstructionLabel>בבנייה</ConstructionLabel>
                <Typography variant="h6" gutterBottom>
                  <MessageIcon /> הודעות אחרונות
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="אין הודעות חדשות" 
                      secondary="" 
                    />
                  </ListItem>
                </List>
              </ConstructionPaper>
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
