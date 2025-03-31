import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Chip,
  Stack,
  Fade,
  Grow,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  EmojiEvents as TournamentIcon,
  TrendingUp as MarketIcon,
  CompareArrows as CompareIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  WorkspacePremium as PremiumIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '../services/api';
import { PaymentForm } from '../components/PaymentForm';
import { ReportCustomizer } from '../components/ReportCustomizer';
import { ReportService } from '../services/reportService';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  reportsPerMonth: number;
  features: string[];
  color: 'inherit' | 'primary' | 'secondary';
  icon: React.ReactNode;
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    reportsPerMonth: 0,
    features: [
      'View player profiles',
      'Basic team statistics',
      'Tournament results',
      'Free agent listings',
      'Basic market data',
    ],
    color: 'inherit',
    icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    reportsPerMonth: 10,
    features: [
      'Everything in Free',
      '10 reports per month',
      'Advanced player analytics',
      'Team performance reports',
      'Tournament analysis',
      'Market insights',
      'Player comparisons',
      'Roster builder access',
    ],
    color: 'primary',
    icon: <StarIcon sx={{ fontSize: 40 }} />,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99.99,
    reportsPerMonth: 50,
    features: [
      'Everything in Pro',
      '50 reports per month',
      'Priority report generation',
      'Custom report templates',
      'API access',
      'Advanced market analysis',
      'Historical data access',
      'Team strategy reports',
    ],
    color: 'secondary',
    icon: <PremiumIcon sx={{ fontSize: 40 }} />,
  },
];

interface ReportType {
  id: string;
  title: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  features: string[];
  category: 'player' | 'team' | 'tournament' | 'market' | 'comparison';
  tier: 'free' | 'pro' | 'premium';
}

const reportTypes: ReportType[] = [
  {
    id: 'player-performance',
    title: 'Player Performance Report',
    description: 'Comprehensive analysis of player performance, including historical data, trends, and salary projections.',
    price: 9.99,
    icon: <PersonIcon sx={{ fontSize: 40 }} />,
    features: [
      'Detailed performance metrics',
      'Historical performance trends',
      'Tournament results analysis',
      'Role-specific insights',
      'Salary projections',
      'Market value assessment',
    ],
    category: 'player',
    tier: 'pro',
  },
  {
    id: 'team-analysis',
    title: 'Team Analysis Report',
    description: 'In-depth analysis of team performance, roster composition, and strategic insights.',
    price: 19.99,
    icon: <GroupsIcon sx={{ fontSize: 40 }} />,
    features: [
      'Team performance metrics',
      'Roster composition analysis',
      'Player synergy assessment',
      'Strategic recommendations',
      'Budget optimization',
      'Future roster planning',
    ],
    category: 'team',
    tier: 'pro',
  },
  {
    id: 'tournament-stats',
    title: 'Tournament Statistics Report',
    description: 'Detailed statistics and analysis of tournament performance and trends.',
    price: 14.99,
    icon: <TournamentIcon sx={{ fontSize: 40 }} />,
    features: [
      'Tournament performance metrics',
      'Prize pool analysis',
      'Team rankings and trends',
      'Player statistics',
      'Historical comparisons',
      'Future projections',
    ],
    category: 'tournament',
    tier: 'pro',
  },
  {
    id: 'market-analysis',
    title: 'Market Analysis Report',
    description: 'Comprehensive analysis of the player market, including trends and opportunities.',
    price: 24.99,
    icon: <MarketIcon sx={{ fontSize: 40 }} />,
    features: [
      'Market trends analysis',
      'Salary benchmarks',
      'Free agent opportunities',
      'Regional market insights',
      'Role demand analysis',
      'Future market projections',
    ],
    category: 'market',
    tier: 'premium',
  },
  {
    id: 'player-comparison',
    title: 'Player Comparison Report',
    description: 'Detailed side-by-side comparison of multiple players with comprehensive metrics.',
    price: 14.99,
    icon: <CompareIcon sx={{ fontSize: 40 }} />,
    features: [
      'Performance comparison',
      'Salary comparison',
      'Role-specific analysis',
      'Tournament experience',
      'Market value assessment',
      'Strategic fit analysis',
    ],
    category: 'comparison',
    tier: 'pro',
  },
];

export const Reports: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [selectedReportForCustomization, setSelectedReportForCustomization] = useState<ReportType | null>(null);

  const handleTierSelect = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setPaymentDialogOpen(true);
    setPaymentError(null);
  };

  const handleReportSelect = (report: ReportType) => {
    setSelectedReportForCustomization(report);
    setCustomizationDialogOpen(true);
  };

  const handleCustomizationSubmit = async (customizations: Record<string, any>) => {
    if (!selectedReportForCustomization) return;

    try {
      // Create the report with customizations
      await ReportService.createReport(
        selectedReportForCustomization.id,
        'current-user-id', // TODO: Get actual user ID
        {
          ...customizations,
          reportType: selectedReportForCustomization.id,
        }
      );

      // Close customization dialog
      setCustomizationDialogOpen(false);
      setSelectedReportForCustomization(null);

      // Show success message
      setPaymentStatus('success');
      setTimeout(() => {
        setPaymentStatus('idle');
      }, 2000);
    } catch (error) {
      setPaymentStatus('error');
      setPaymentError(error instanceof Error ? error.message : 'Failed to generate report');
      setTimeout(() => {
        setPaymentStatus('idle');
        setPaymentError(null);
      }, 5000);
    }
  };

  const handleCustomizationCancel = () => {
    setCustomizationDialogOpen(false);
    setSelectedReportForCustomization(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Fade in timeout={500}>
        <Typography variant="h4" component="h1" gutterBottom>
          Subscription Plans
        </Typography>
      </Fade>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Choose a plan that best fits your needs. All plans include access to basic features, with premium features available in higher tiers.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {subscriptionTiers.map((tier, index) => (
          <Grid item xs={12} md={4} key={tier.id}>
            <Grow in timeout={500} style={{ transitionDelay: `${index * 100}ms` }}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  border: tier.color !== 'inherit' ? `2px solid ${tier.color}` : undefined,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {tier.icon}
                    <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                      {tier.name}
                    </Typography>
                  </Box>
                  <Typography variant="h4" color="primary" gutterBottom>
                    ${tier.price.toFixed(2)}
                    <Typography component="span" variant="subtitle1" color="text.secondary">
                      /month
                    </Typography>
                  </Typography>
                  {tier.reportsPerMonth > 0 && (
                    <Typography variant="subtitle1" gutterBottom>
                      {tier.reportsPerMonth} reports per month
                    </Typography>
                  )}
                  <List dense>
                    {tier.features.map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckIcon color={tier.color} />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant={tier.color === 'inherit' ? 'outlined' : 'contained'}
                    color={tier.color}
                    onClick={() => handleTierSelect(tier)}
                  >
                    {tier.id === 'free' ? 'Get Started' : 'Subscribe'}
                  </Button>
                </CardActions>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 6 }}>
        Individual Reports
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Purchase individual reports as needed. Subscription members receive discounts on report purchases.
      </Typography>

      <Grid container spacing={3}>
        {reportTypes.map((report) => (
          <Grid item xs={12} md={6} lg={4} key={report.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {report.icon}
                  <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                    {report.title}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip 
                    label={report.tier} 
                    color={report.tier === 'premium' ? 'secondary' : 'primary'} 
                    size="small" 
                  />
                </Stack>
                <Typography color="text.secondary" paragraph>
                  {report.description}
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  ${report.price.toFixed(2)}
                </Typography>
                <List dense>
                  {report.features.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handleReportSelect(report)}
                >
                  Purchase Report
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedTier ? `Subscribe to ${selectedTier.name} Plan` : `Purchase ${selectedReport?.title}`}
        </DialogTitle>
        <DialogContent>
          {paymentStatus === 'processing' && (
            <Alert severity="info">
              Processing payment...
            </Alert>
          )}
          {paymentStatus === 'success' && (
            <Alert severity="success">
              {selectedTier 
                ? 'Subscription activated successfully!'
                : 'Payment successful! Your report is being generated.'}
            </Alert>
          )}
          {paymentStatus === 'error' && (
            <Alert severity="error">
              {paymentError || 'Payment failed. Please try again.'}
            </Alert>
          )}
          {paymentStatus === 'idle' && (
            <>
              <Typography variant="body1" paragraph>
                {selectedTier
                  ? `You are about to subscribe to the ${selectedTier.name} plan for $${selectedTier.price.toFixed(2)}/month.`
                  : `You are about to purchase the ${selectedReport?.title} for $${selectedReport?.price.toFixed(2)}.`}
              </Typography>
              <List>
                {(selectedTier?.features || selectedReport?.features)?.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" color="primary" gutterBottom>
                Total: ${(selectedTier?.price || selectedReport?.price || 0).toFixed(2)}
                {selectedTier && '/month'}
              </Typography>
              <PaymentForm
                amount={selectedTier?.price || selectedReport?.price || 0}
                type={selectedTier ? 'subscription' : 'report'}
                tierId={selectedTier?.id}
                reportId={selectedReport?.id}
                onSuccess={() => {
                  setPaymentStatus('success');
                  setTimeout(() => {
                    setPaymentStatus('idle');
                    setSelectedTier(null);
                    setSelectedReport(null);
                  }, 2000);
                }}
                onError={(error) => {
                  setPaymentStatus('error');
                  setPaymentError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
                  setTimeout(() => {
                    setPaymentStatus('idle');
                    setPaymentError(null);
                  }, 5000);
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={customizationDialogOpen}
        onClose={handleCustomizationCancel}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
      >
        <DialogTitle>
          Customize {selectedReportForCustomization?.title}
        </DialogTitle>
        <DialogContent>
          {selectedReportForCustomization && (
            <ReportCustomizer
              reportType={selectedReportForCustomization.id}
              onCustomize={handleCustomizationSubmit}
              onCancel={handleCustomizationCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}; 