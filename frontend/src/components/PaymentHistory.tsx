import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'subscription' | 'report';
  status: 'completed' | 'pending' | 'failed';
  description: string;
  reportId?: string;
}

interface Subscription {
  id: string;
  tier: string;
  startDate: string;
  nextBillingDate: string;
  status: 'active' | 'cancelled' | 'expired';
  reportsRemaining: number;
}

export const PaymentHistory: React.FC = () => {
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await fetch('/api/subscription');
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json();
    },
  });

  const handleDownloadReceipt = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/receipts/${transactionId}`);
      if (!response.ok) throw new Error('Failed to download receipt');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'active':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (isLoadingTransactions || isLoadingSubscription) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {subscription && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Subscription
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1">
                {subscription.tier} Plan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Next billing date: {new Date(subscription.nextBillingDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reports remaining this month: {subscription.reportsRemaining}
              </Typography>
            </Box>
            <Chip
              label={subscription.status}
              color={getStatusColor(subscription.status)}
              size="small"
            />
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Transaction History
          </Typography>
          <Tooltip title="Refresh">
            <IconButton>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions?.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.type}
                      size="small"
                      color={transaction.type === 'subscription' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status}
                      size="small"
                      color={getStatusColor(transaction.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Download Receipt">
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadReceipt(transaction.id)}
                      >
                        <ReceiptIcon />
                      </IconButton>
                    </Tooltip>
                    {transaction.reportId && (
                      <Tooltip title="Download Report">
                        <IconButton size="small">
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}; 