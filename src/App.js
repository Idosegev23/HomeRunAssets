import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PropertyList from './components/PropertyList';
import CustomerList from './components/CustomerList';
import SendMessages from './components/SendMessages';
import Building from './pages/building';
import AddCustomer from './pages/AddCustomer';
import AddProperty from './pages/AddProperty';
import ChatInterface from './components/ChatInterface';
import './index.css';
import IncomingMessages from './components/IncomingMessages';
import { MessageProvider } from './context/MessageContext';
import MessageStatus from './components/messaging/MessageStatus';
import MessageQueue from './pages/MessageQueue'; // נוסיף את הדף החדש של תור ההודעות

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MessageProvider>
          <Router>
            <Navbar />
            <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/properties" element={<PropertyList />} />
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/send-messages" element={<SendMessages />} />
                <Route path="/incoming-messages" element={<IncomingMessages />} />
                <Route path="/chat" element={<ChatInterface />} />
                <Route path="/building" element={<Building />} />
                <Route path="/add-customer" element={<AddCustomer />} />
                <Route path="/add-property" element={<AddProperty />} />
                <Route path="/message-queue" element={<MessageQueue />} /> {/* הוספנו ניתוב לדף תור ההודעות */}
              </Routes>
            </Container>
            <MessageStatus />
          </Router>
        </MessageProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;