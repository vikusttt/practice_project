import React, { useState, useEffect } from 'react';
import { Box, Modal, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import socialCreditImage from '../assets/socialcredit.png';

const SocialCreditPopup = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if the language is Chinese
    if (i18n.language === 'zh') {
      setOpen(true);
    } else {
      setOpen(false);
    }
    
    // Listen for explicit language change events
    const handleLanguageChange = () => {
      if (i18n.language === 'zh') {
        setOpen(true);
      }
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [i18n.language]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="social-credit-modal"
      aria-describedby="social-credit-system-popup"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          bgcolor: 'black',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h2" color="error" fontWeight="bold" sx={{ mb: 2 }}>
            注意! ATTENTION!
          </Typography>
          <img
            src={socialCreditImage}
            alt="Social Credit System"
            style={{
              maxWidth: '90%',
              maxHeight: '70vh',
              objectFit: 'contain',
            }}
          />
          <Typography variant="h4" color="error" sx={{ mt: 3 }}>
            您的社会信用评分已降低 -9999 分
          </Typography>
          <Typography variant="h6" color="error" sx={{ mt: 1 }}>

          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={handleClose}
            sx={{ mt: 3, fontSize: '1.2rem', p: '10px 30px' }}
          >
            关闭 (Close)
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SocialCreditPopup;
