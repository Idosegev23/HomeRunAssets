import React from 'react';
import { Toolbar, Typography, Box, IconButton, Switch } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import { StyledAppBar } from './PropertyListStyles';

const PLAppBar = ({ isDarkMode, toggleDarkMode, viewMode, toggleViewMode, fetchProperties }) => {
  return (
    <StyledAppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          רשימת נכסים
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color="inherit" onClick={fetchProperties}>
          <RefreshIcon />
        </IconButton>
        <Switch checked={isDarkMode} onChange={toggleDarkMode} color="default" />
        <IconButton color="inherit" onClick={toggleViewMode}>
          {viewMode === 'table' ? <ViewModuleIcon /> : <ViewListIcon />}
        </IconButton>
      </Toolbar>
    </StyledAppBar>
  );
};

export default PLAppBar;