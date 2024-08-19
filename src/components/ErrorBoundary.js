import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // עדכון state כך שהרנדור הבא יציג את ממשק השגיאה.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // אפשר לרשום את השגיאה למערכת ניתוח שגיאות
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      // אפשר לרנדר כל ממשק שגיאה מותאם אישית
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          textAlign="center"
          p={3}
        >
          <Typography variant="h4" gutterBottom>
            אופס! משהו השתבש.
          </Typography>
          <Typography variant="body1" paragraph>
            אנו מתנצלים על אי הנוחות. נסה לטעון מחדש את הדף.
          </Typography>
          <Button variant="contained" color="primary" onClick={this.handleReload}>
            טען מחדש
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Box mt={4} textAlign="left">
              <Typography variant="h6">פרטי השגיאה:</Typography>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;