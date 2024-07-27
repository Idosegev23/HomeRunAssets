import React, { useEffect, useRef } from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import Countdown from 'react-countdown';
import { styled } from '@mui/system';

const PageBackground = styled('div')({
  background: '#f5f5f5',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const ContentCard = styled(Box)({
  background: 'white',
  borderRadius: '8px',
  padding: '2rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  width: '100%',
  textAlign: 'center',
});

const Logo = styled('img')({
  width: '200px',
  display: 'block',
  margin: '0 auto 2rem',
});

const StyledButton = styled(Button)({
  background: '#1976d2',
  color: 'white',
  padding: '10px 20px',
  margin: '1rem 0',
  '&:hover': {
    background: '#1565c0',
  },
});

const ProgressBar = styled(Box)({
  width: '100%',
  height: '20px',
  backgroundColor: '#e0e0e0',
  borderRadius: '10px',
  overflow: 'hidden',
  margin: '1rem auto',
});

const Progress = styled(Box)({
  height: '100%',
  background: '#1976d2',
  borderRadius: '10px',
  transition: 'width 0.5s ease-in-out',
});

const Building = () => {
  const canvasRef = useRef(null);
  const targetDate = new Date('2024-08-15T00:00:00');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let step = 0;

    const drawHouse = (progress) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // קרקע
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(0, 180, 300, 20);
      
      // קירות
      ctx.fillStyle = '#FFA000';
      ctx.fillRect(75, 180 - 100 * progress, 150, 100 * progress);
      
      if (progress > 0.6) {
        // גג
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.moveTo(75, 80);
        ctx.lineTo(150, 30);
        ctx.lineTo(225, 80);
        ctx.closePath();
        ctx.fill();
      }
      
      if (progress > 0.8) {
        // דלת
        ctx.fillStyle = '#795548';
        ctx.fillRect(130, 130, 40, 50);
        
        // חלון
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(180, 110, 30, 30);
      }
    };

    const animate = () => {
      step++;
      const progress = Math.min(step / 100, 1);
      drawHouse(progress);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return <Typography variant="h5">הדף מוכן!</Typography>;
    } else {
      return (
        <Typography variant="h5" fontFamily="Heebo, sans-serif">
          {`${days} ימים ${hours} שעות ${minutes} דקות ${seconds} שניות`}
        </Typography>
      );
    }
  };

  return (
    <PageBackground>
      <Container maxWidth="md">
        <ContentCard>
          <Logo src="https://courses.triroars.co.il/static/media/NewLogo_BLANK.331a9671220d7891575e.png" alt="Logo" />
          <Typography variant="h3" gutterBottom fontFamily="Heebo, sans-serif">
            בבנייה אל תלחיצו
          </Typography>
          <Box my={4}>
            <Typography variant="h6" gutterBottom fontFamily="Heebo, sans-serif">
              אני בונה את זה עכשיו מבטיח שיהיה יפה
            </Typography>
            <Box display="flex" justifyContent="center" my={3}>
              <canvas ref={canvasRef} width={300} height={200} style={{ border: '1px solid #ddd' }} />
            </Box>
            <ProgressBar>
              <Progress width="50%" />
            </ProgressBar>
            <Box display="flex" justifyContent="center">
              <StyledButton component={Link} to="/">
                לדף הבית
              </StyledButton>
            </Box>
            <Box mt={4}>
              <Typography variant="h5" fontFamily="Heebo, sans-serif">
                זמן נותר עד לפתיחה:
              </Typography>
              <Countdown date={targetDate} renderer={renderer} />
            </Box>
          </Box>
        </ContentCard>
      </Container>
    </PageBackground>
  );
};

export default Building;