import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    if (!paymentIntentId) {
      setStatus('error');
      setError('No payment information found');
      return;
    }

    const confirmPayment = async () => {
      try {
        const response = await fetch('/api/payments/payment-success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentIntentId }),
        });

        if (!response.ok) {
          throw new Error('Failed to confirm payment');
        }

        setStatus('success');
      } catch (error) {
        console.error('Error confirming payment:', error);
        setStatus('error');
        setError('Failed to confirm payment. Please contact support.');
      }
    };

    confirmPayment();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Confirming your payment...
        </Typography>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/reports')}
        >
          Return to Reports
        </Button>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
    >
      <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Payment Successful!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Thank you for your purchase. Your subscription/report will be available shortly.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/reports')}
      >
        Return to Reports
      </Button>
    </Box>
  );
}; 