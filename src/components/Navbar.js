import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Divider } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import { 
  Home as HomeIcon, 
  Business as BusinessIcon, 
  People as PeopleIcon, 
  Send as SendIcon, 
  Message as MessageIcon, 
  Chat as ChatIcon,
  PersonAdd as PersonAddIcon,
  HomeWork as HomeWorkIcon
} from '@mui/icons-material';

const useStyles = makeStyles((theme) => ({
  appBar: {
    backgroundColor: '#4a90e2',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  toolbar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
  },
  title: {
    fontWeight: 'bold',
    fontSize: '2rem',
    color: '#FFFFFF',
    marginBottom: theme.spacing(2),
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    letterSpacing: '1px',
  },
  navLinks: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    '& > *:not(:last-child)': {
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(2),
    },
  },
  link: {
    color: '#FFFFFF',
    textDecoration: 'none',
    padding: theme.spacing(1, 2),
    borderRadius: '20px',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: theme.spacing(1),
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      transform: 'translateY(-3px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
  },
  activeLink: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    fontWeight: 'bold',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
  },
  icon: {
    marginLeft: theme.spacing(1),
    transition: 'transform 0.3s ease',
    color: '#FFFFFF',
    '$link:hover &': {
      transform: 'rotate(10deg)',
    },
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    height: '20px',
    margin: theme.spacing(0, 1),
  },
  buttonText: {
    color: '#FFFFFF',
  },
}));

const Navbar = () => {
  const classes = useStyles();
  const location = useLocation();

  const navItems = [
    { label: 'דף הבית', path: '/', icon: <HomeIcon className={classes.icon} /> },
    { label: 'נכסים', path: '/properties', icon: <BusinessIcon className={classes.icon} /> },
    { label: 'לקוחות', path: '/customers', icon: <PeopleIcon className={classes.icon} /> },
    { label: 'שליחת הודעות', path: '/send-messages', icon: <SendIcon className={classes.icon} /> },
    { label: 'הודעות נכנסות', path: '/incoming-messages', icon: <MessageIcon className={classes.icon} /> },
    { label: "צ'אט", path: '/chat', icon: <ChatIcon className={classes.icon} /> },
    { label: 'הוסף לקוח', path: '/add-customer', icon: <PersonAddIcon className={classes.icon} /> },
    { label: 'הוסף נכס', path: '/add-property', icon: <HomeWorkIcon className={classes.icon} /> },
  ];

  return (
    <AppBar position="sticky" className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        <Typography variant="h6" className={classes.title}>
          HomeRun נדל"ן
        </Typography>
        <Box className={classes.navLinks}>
          {navItems.map((item, index) => (
            <React.Fragment key={item.path}>
              <Button
                component={RouterLink}
                to={item.path}
                className={`${classes.link} ${location.pathname === item.path ? classes.activeLink : ''}`}
              >
                <span className={classes.buttonText}>{item.label}</span>
                {item.icon}
              </Button>
              {index < navItems.length - 1 && <Divider orientation="vertical" flexItem className={classes.divider} />}
            </React.Fragment>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;