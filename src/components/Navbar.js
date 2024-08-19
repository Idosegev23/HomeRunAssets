import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Divider } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Business as BusinessIcon, 
  People as PeopleIcon, 
  Message as MessageIcon, 
  Chat as ChatIcon,
  PersonAdd as PersonAddIcon,
  HomeWork as HomeWorkIcon
} from '@mui/icons-material';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { label: 'דף הבית', path: '/', icon: <HomeIcon sx={{ marginLeft: 1 }} /> },
    { label: 'נכסים', path: '/properties', icon: <BusinessIcon sx={{ marginLeft: 1 }} /> },
    { label: 'לקוחות', path: '/customers', icon: <PeopleIcon sx={{ marginLeft: 1 }} /> },
    { label: 'הודעות נכנסות', path: '/incoming-messages', icon: <MessageIcon sx={{ marginLeft: 1 }} /> },
    { label: "צ'אט", path: '/chat', icon: <ChatIcon sx={{ marginLeft: 1 }} /> },
    { label: 'הוסף לקוח', path: '/add-customer', icon: <PersonAddIcon sx={{ marginLeft: 1 }} /> },
    { label: 'הוסף נכס', path: '/add-property', icon: <HomeWorkIcon sx={{ marginLeft: 1 }} /> },
  ];

  return (
    <AppBar position="sticky" sx={{ backgroundColor: '#4a90e2', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '2rem', color: '#FFFFFF', marginBottom: 2, textShadow: '2px 2px 4px rgba(0,0,0,0.3)', letterSpacing: '1px' }}>
          HomeRun נדל"ן
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {navItems.map((item, index) => (
            <React.Fragment key={item.path}>
              <Button
                component={RouterLink}
                to={item.path}
                sx={{
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  margin: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                  },
                  ...(location.pathname === item.path && {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    fontWeight: 'bold',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                  })
                }}
              >
                <span>{item.label}</span>
                {item.icon}
              </Button>
              {index < navItems.length - 1 && <Divider orientation="vertical" flexItem sx={{ backgroundColor: 'rgba(255, 255, 255, 0.3)', height: '20px', margin: '0 8px' }} />}
            </React.Fragment>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
