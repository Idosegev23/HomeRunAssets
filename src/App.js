import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container } from '@mui/material';
 import { createTheme } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import Navbar from './components/Navbar.js';import Home from './pages/Home.js';import PropertyList from './components/PropertyList.js';import CustomerList from './components/CustomerList.js';import SendMessages from './components/SendMessages.js';import Building from './pages/building.js';import AddCustomer from './pages/AddCustomer.js';import AddProperty from './pages/AddProperty.js';import ChatInterface from './components/ChatInterface.js';import './index.css';
import IncomingMessages from './components/IncomingMessages.js';import { MessageProvider } from './context/MessageContext.js';import MessageStatus from './components/messaging/MessageStatus.js';import MessageQueue from './pages/MessageQueue.js'; // נוסיף את הדף החדש של תור ההודעות

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