import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analysisApi } from '../services/api';

const COLORS = ['#FF4655', '#0F1923', '#4A5459', '#8B978F', '#C6CCD2'];

export default function Analysis() {
  const [timeRange, setTimeRange] = React.useState('1y');
  const [region, setRegion] = React.useState('all');

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['analysis', 'stats', timeRange, region],
    queryFn: () => analysisApi.getStats({ timeRange, region }),
  });

  const { data: trends, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['analysis', 'trends', timeRange, region],
    queryFn: () => analysisApi.getTrends({ timeRange, region }),
  });

  const { data: distribution, isLoading: isLoadingDistribution } = useQuery({
    queryKey: ['analysis', 'distribution', timeRange, region],
    queryFn: () => analysisApi.getDistribution({ timeRange, region }),
  });

  if (isLoadingStats || isLoadingTrends || isLoadingDistribution) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Market Analysis</Typography>
        <Box display="flex" gap={2}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="1m">Last Month</MenuItem>
              <MenuItem value="3m">Last 3 Months</MenuItem>
              <MenuItem value="6m">Last 6 Months</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Region</InputLabel>
            <Select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              label="Region"
            >
              <MenuItem value="all">All Regions</MenuItem>
              {stats?.regions?.map((r: string) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Market Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Prize Money
              </Typography>
              <Typography variant="h4">
                ${stats?.totalPrizeMoney?.toLocaleString()}
              </Typography>
              <Typography variant="body2" color={stats?.prizeMoneyGrowth > 0 ? 'success.main' : 'error.main'}>
                {stats?.prizeMoneyGrowth > 0 ? '+' : ''}{stats?.prizeMoneyGrowth}% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Players
              </Typography>
              <Typography variant="h4">
                {stats?.activePlayers?.toLocaleString()}
              </Typography>
              <Typography variant="body2" color={stats?.playerGrowth > 0 ? 'success.main' : 'error.main'}>
                {stats?.playerGrowth > 0 ? '+' : ''}{stats?.playerGrowth}% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Team Value
              </Typography>
              <Typography variant="h4">
                ${stats?.averageTeamValue?.toLocaleString()}
              </Typography>
              <Typography variant="body2" color={stats?.teamValueGrowth > 0 ? 'success.main' : 'error.main'}>
                {stats?.teamValueGrowth > 0 ? '+' : ''}{stats?.teamValueGrowth}% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tournament Count
              </Typography>
              <Typography variant="h4">
                {stats?.tournamentCount}
              </Typography>
              <Typography variant="body2" color={stats?.tournamentGrowth > 0 ? 'success.main' : 'error.main'}>
                {stats?.tournamentGrowth > 0 ? '+' : ''}{stats?.tournamentGrowth}% vs previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Prize Money Distribution */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Prize Money Trends</Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends?.prizeMoney}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#FF4655" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Prize Distribution by Region</Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution?.prizeByRegion}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {distribution?.prizeByRegion.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Player Value Distribution</Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution?.playerValues}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF4655" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 