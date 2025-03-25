import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  Link,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
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
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  ControlPoint as ControllerIcon,
} from '@mui/icons-material';
import { adminApi, playerApi, teamApi, analysisApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [playerStatus, setPlayerStatus] = useState<string>('all');
  
  // Add effect to log filter changes
  useEffect(() => {
    console.log('Filter values changed:', {
      region: selectedRegion,
      country: selectedCountry,
      division: selectedDivision,
      status: playerStatus
    });
  }, [selectedRegion, selectedCountry, selectedDivision, playerStatus]);

  const regionCountries = {
    NA: ['US', 'CA', 'MX'],
    EU: ['GB', 'DE', 'FR', 'ES', 'IT', 'SE', 'DK', 'NO', 'FI', 'PL', 'NL', 'BE', 'CH', 'AT', 'PT', 'IE', 'GR', 'HU', 'CZ', 'SK', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'CY', 'LU', 'MT'],
    APAC: ['KR', 'JP', 'CN', 'TW', 'HK', 'SG', 'AU', 'NZ', 'ID', 'MY', 'PH', 'TH', 'VN', 'IN', 'PK', 'BD', 'LK', 'MM', 'KH', 'LA'],
    BR: ['BR'],
    LATAM: ['AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'CR', 'PA', 'DO', 'GT', 'SV', 'HN', 'NI', 'PR'],
    MENA: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'EG', 'IL', 'TR', 'IR', 'IQ', 'SY', 'JO', 'LB', 'PS', 'YE'],
    SA: ['ZA', 'NG', 'EG', 'MA', 'TN', 'DZ', 'KE', 'GH', 'CI', 'SN', 'CM', 'UG', 'RW', 'ET', 'ZA'],
  };

  // Fetch data using React Query
  const { data: dbStats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['dbStats'],
    queryFn: adminApi.getDatabaseStats,
    onError: (error) => {
      console.error('Error fetching database stats:', error);
    }
  });

  const { data: topPlayers, isLoading: isLoadingTopPlayers, error: topPlayersError } = useQuery({
    queryKey: ['topPlayers', selectedRegion, selectedCountry, selectedDivision, playerStatus],
    queryFn: () => {
      const params = { 
        limit: 5,
        region: selectedRegion !== 'all' ? selectedRegion : undefined,
        country_code: selectedCountry !== 'all' ? selectedCountry : undefined,
        division: selectedDivision !== 'all' ? selectedDivision : undefined,
        is_free_agent: playerStatus === 'free_agent' ? true : playerStatus === 'signed' ? false : undefined,
        stat: 'rating'
      };
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Filter values:', {
          region: selectedRegion,
          country: selectedCountry,
          division: selectedDivision,
          status: playerStatus
        });
        console.log('Sending query parameters:', JSON.stringify(params, null, 2));
      }
      
      return playerApi.getTopPlayers(params);
    },
    // Add staleTime to prevent unnecessary refetches
    staleTime: 5000,
    // Add cacheTime to keep data in cache
    cacheTime: 30000,
    onError: (error) => {
      console.error('Error fetching top players:', error);
    }
  });

  const { data: marketAnalysis, isLoading: isLoadingMarket, error: marketError } = useQuery({
    queryKey: ['marketAnalysis'],
    queryFn: () => analysisApi.getFreeAgentMarket(),
    onError: (error) => {
      console.error('Error fetching market analysis:', error);
    }
  });

  if (isLoadingStats || isLoadingTopPlayers || isLoadingMarket) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Handle errors
  if (statsError || topPlayersError || marketError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading dashboard data. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  // Handle case where data is not yet available
  if (!dbStats || !marketAnalysis) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const handleFreeAgentsClick = () => {
    navigate('/analysis/free-agents');
  };

  const handlePlayerClick = (id: string) => {
    navigate(`/players/${id}`);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '$0';
    return `$${value.toLocaleString()}`;
  };
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0%';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Optimize filter change handlers
  const handleRegionChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedRegion(e.target.value as string);
    setSelectedCountry('all');
  };

  const handleCountryChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as string;
    setSelectedCountry(value);
    if (value !== 'all') {
      setSelectedRegion('all');
    }
  };

  const handleDivisionChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedDivision(e.target.value as string);
  };

  const handleStatusChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setPlayerStatus(e.target.value as string);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Market Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Market Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PeopleIcon color="primary" />
                      <Typography color="textSecondary">Free Agents</Typography>
                    </Box>
                    <Typography variant="h4">
                      {dbStats?.players.free_agents || 0}
                      <Link
                        component="button"
                        variant="body2"
                        onClick={handleFreeAgentsClick}
                        sx={{ ml: 1, textDecoration: 'none' }}
                      >
                        View All
                      </Link>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {formatPercentage((dbStats?.players.free_agents || 0) / (dbStats?.players.total || 1))} of total players
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <MoneyIcon color="primary" />
                      <Typography color="textSecondary">Avg. Value</Typography>
                    </Box>
                    <Typography variant="h4">
                      {formatCurrency(marketAnalysis?.market_stats?.average_value)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {formatCurrency(marketAnalysis?.market_stats?.min_value)} - {formatCurrency(marketAnalysis?.market_stats?.max_value)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <StarIcon color="primary" />
                      <Typography color="textSecondary">Elite Talent</Typography>
                    </Box>
                    <Typography variant="h4">
                      {marketAnalysis?.talent_distribution?.elite ?? 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {formatPercentage((marketAnalysis?.talent_distribution?.elite ?? 0) / (marketAnalysis?.total_free_agents || 1))} of free agents
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <GroupIcon color="primary" />
                      <Typography color="textSecondary">Open Spots</Typography>
                    </Box>
                    <Typography variant="h4">
                      {marketAnalysis?.total_free_agents ?? 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Across {dbStats?.teams?.total ?? 0} active teams
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Top Players */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Top Players by Rating
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Region</InputLabel>
                <Select
                  value={selectedRegion}
                  label="Region"
                  onChange={handleRegionChange}
                >
                  <MenuItem value="all">All Regions</MenuItem>
                  <MenuItem value="NA">North America</MenuItem>
                  <MenuItem value="EU">Europe</MenuItem>
                  <MenuItem value="APAC">Asia Pacific</MenuItem>
                  <MenuItem value="BR">Brazil</MenuItem>
                  <MenuItem value="LATAM">Latin America</MenuItem>
                  <MenuItem value="MENA">Middle East & North Africa</MenuItem>
                  <MenuItem value="SA">South Africa</MenuItem>
                </Select>
              </FormControl>
              {selectedRegion !== 'all' && (
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={selectedCountry}
                    label="Country"
                    onChange={handleCountryChange}
                  >
                    <MenuItem value="all">All Countries</MenuItem>
                    {regionCountries[selectedRegion as keyof typeof regionCountries]?.map((countryCode) => (
                      <MenuItem key={countryCode} value={countryCode}>
                        {new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Division</InputLabel>
                <Select
                  value={selectedDivision}
                  label="Division"
                  onChange={handleDivisionChange}
                >
                  <MenuItem value="all">All Divisions</MenuItem>
                  <MenuItem value="T1">T1</MenuItem>
                  <MenuItem value="T2">T2</MenuItem>
                  <MenuItem value="T3">T3</MenuItem>
                  <MenuItem value="T4">T4</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={playerStatus}
                  label="Status"
                  onChange={handleStatusChange}
                >
                  <MenuItem value="all">All Players</MenuItem>
                  <MenuItem value="free_agent">Free Agents</MenuItem>
                  <MenuItem value="signed">Signed</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <List>
              {topPlayers?.map((player) => (
                <ListItem
                  key={player.id}
                  button
                  onClick={() => handlePlayerClick(player.id)}
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <StarIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box>
                        {player.name}
                        <Box display="flex" gap={1} alignItems="center" mt={1}>
                          <Chip
                            label={`Rating: ${(player.rating ?? 0).toFixed(2)}`}
                            size="small"
                            color="primary"
                          />
                          <Chip
                            label={player.division || 'Unranked'}
                            size="small"
                            color={player.division === 'T1' ? 'error' : 
                                   player.division === 'T2' ? 'warning' : 
                                   player.division === 'T3' ? 'info' : 
                                   player.division === 'T4' ? 'success' : 'default'}
                          />
                          {player.team_abbreviation && (
                            <Chip
                              label={player.team_abbreviation}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Market Insights */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Market Insights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Talent Distribution
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Elite', value: marketAnalysis?.talent_distribution?.elite ?? 0 },
                      { name: 'Above Avg', value: marketAnalysis?.talent_distribution?.above_average ?? 0 },
                      { name: 'Average', value: marketAnalysis?.talent_distribution?.average ?? 0 },
                      { name: 'Below Avg', value: marketAnalysis?.talent_distribution?.below_average ?? 0 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Role Distribution
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(marketAnalysis?.role_distribution || {}).map(([role, count]) => (
                    <Chip
                      key={role}
                      label={`${role}: ${count}`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Top Prospects
                </Typography>
                <List>
                  {marketAnalysis?.top_prospects?.map((player) => (
                    <ListItem
                      key={player.id}
                      button
                      onClick={() => handlePlayerClick(player.id)}
                    >
                      <ListItemAvatar>
                        <Avatar>{player.name[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={player.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {player.division} • {player.country_code}
                            </Typography>
                            <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                              {formatCurrency(player.estimated_value)}
                            </Typography>
                            {player.playstyle?.role_percentages && (
                              <Box sx={{ mt: 0.5 }}>
                                {Object.entries(player.playstyle.role_percentages)
                                  .filter(([_, percentage]) => percentage >= 30)
                                  .map(([role, percentage]) => (
                                    <Chip
                                      key={role}
                                      label={`${role}: ${Math.round(percentage)}%`}
                                      size="small"
                                      sx={{ mr: 0.5 }}
                                    />
                                  ))}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 