import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Compare as CompareIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  AttachMoney as MoneyIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  Target as TargetIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { analysisApi, playerApi } from '../services/api';
import { PlayerFlagWithFallback } from '../components/PlayerFlag';

interface Player {
  id: string;
  name: string;
  region: string;
  competitive_tier: string;
  agent_types: string[];
  rating: number;
  kd_ratio: number;
  headshot_percentage: number;
  first_blood_percentage: number;
  clutch_percentage: number;
  average_combat_score: number;
  win_rate: number;
  earnings: number;
  estimated_salary: number;
  tournament_experience: number;
  last_active: string;
  country_code: string;
  country: string;
}

interface ComparisonMetrics {
  performance: {
    rating: number;
    kd_ratio: number;
    headshot_percentage: number;
    first_blood_percentage: number;
    clutch_percentage: number;
    average_combat_score: number;
    win_rate: number;
  };
  financial: {
    estimated_salary: number;
    earnings: number;
    value_for_money: number;
  };
  experience: {
    tournament_experience: number;
    last_active: string;
    competitive_tier: string;
  };
  role_specific: {
    [key: string]: number;
  };
}

export const PlayerComparison: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);

  const { data: freeAgents, isLoading } = useQuery({
    queryKey: ['freeAgents', searchTerm],
    queryFn: () => analysisApi.getFreeAgentMarket({
      search: searchTerm,
      limit: 10,
    }),
  });

  const { data: comparison, isLoading: isLoadingComparison } = useQuery({
    queryKey: ['playerComparison', selectedPlayers.map(p => p.id)],
    queryFn: () => analysisApi.comparePlayers({
      player_ids: selectedPlayers.map(p => p.id),
    }),
    enabled: selectedPlayers.length >= 2 && selectedPlayers.length <= 5,
  });

  const handlePlayerSelect = (player: Player) => {
    if (selectedPlayers.length >= 5) return;
    if (!selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(prev => [...prev, player]);
    }
  };

  const handlePlayerRemove = (playerId: string) => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const performanceData = selectedPlayers.map(player => ({
    name: player.name,
    rating: player.rating,
    kd_ratio: player.kd_ratio,
    headshot_percentage: player.headshot_percentage,
    first_blood_percentage: player.first_blood_percentage,
    clutch_percentage: player.clutch_percentage,
    average_combat_score: player.average_combat_score,
    win_rate: player.win_rate,
  }));

  const radarData = selectedPlayers.map(player => ({
    name: player.name,
    rating: player.rating,
    kd_ratio: player.kd_ratio,
    headshot_percentage: player.headshot_percentage,
    first_blood_percentage: player.first_blood_percentage,
    clutch_percentage: player.clutch_percentage,
    average_combat_score: player.average_combat_score,
    win_rate: player.win_rate,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Player Comparison</Typography>

      {/* Selected Players */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {selectedPlayers.map((player) => (
          <Grid item xs={12} md={4} key={player.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={2}>
                    <PlayerFlagWithFallback 
                      countryCode={player.country_code}
                      countryName={player.country}
                      size="md"
                    />
                    <Typography variant="h6">{player.name}</Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handlePlayerRemove(player.id)}
                    color="error"
                  >
                    <RemoveIcon />
                  </IconButton>
                </Box>
                <Box display="flex" gap={1} mt={1}>
                  <Chip 
                    label={player.region} 
                    size="small" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={player.competitive_tier} 
                    size="small" 
                    color="primary" 
                  />
                </Box>
                <Box display="flex" gap={1} mt={1}>
                  {player.agent_types.map((agent, index) => (
                    <Chip 
                      key={index} 
                      label={agent} 
                      size="small" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Rating: {player.rating.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatCurrency(player.estimated_salary)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {selectedPlayers.length < 5 && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setComparisonDialogOpen(true)}
                >
                  Add Player
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Comparison Charts */}
      {selectedPlayers.length >= 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip />
                      <Bar dataKey="rating" fill="#8884d8" name="Rating" />
                      <Bar dataKey="kd_ratio" fill="#82ca9d" name="K/D Ratio" />
                      <Bar dataKey="headshot_percentage" fill="#ffc658" name="Headshot %" />
                      <Bar dataKey="first_blood_percentage" fill="#ff7300" name="First Blood %" />
                      <Bar dataKey="clutch_percentage" fill="#387908" name="Clutch %" />
                      <Bar dataKey="average_combat_score" fill="#ff8042" name="ACS" />
                      <Bar dataKey="win_rate" fill="#00C49F" name="Win Rate" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Skill Radar</Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis />
                      <Radar
                        name="Player 1"
                        dataKey="rating"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Player 2"
                        dataKey="kd_ratio"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                      <ChartTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Player Selection Dialog */}
      <Dialog
        open={comparisonDialogOpen}
        onClose={() => setComparisonDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Players to Compare</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <List>
            {freeAgents?.players.map((player: Player) => (
              <React.Fragment key={player.id}>
                <ListItem
                  button
                  onClick={() => handlePlayerSelect(player)}
                  disabled={selectedPlayers.some(p => p.id === player.id)}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <PlayerFlagWithFallback 
                      countryCode={player.country_code}
                      countryName={player.country}
                      size="sm"
                    />
                    <ListItemText
                      primary={player.name}
                      secondary={
                        <Box display="flex" gap={1}>
                          <Chip 
                            label={player.region} 
                            size="small" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={player.competitive_tier} 
                            size="small" 
                            color="primary" 
                          />
                        </Box>
                      }
                    />
                  </Box>
                  <ListItemSecondaryAction>
                    <Typography variant="body2" color="textSecondary">
                      {formatCurrency(player.estimated_salary)}
                    </Typography>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComparisonDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Detailed Comparison Dialog */}
      {comparison && (
        <Dialog
          open={!!comparison}
          onClose={() => setComparison(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Detailed Comparison</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Performance Metrics */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Performance Analysis</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(comparison.performance).map(([metric, value]) => (
                        <Grid item xs={12} md={4} key={metric}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {metric.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box flexGrow={1}>
                              <LinearProgress 
                                variant="determinate" 
                                value={value * 100} 
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                            <Typography variant="body2">
                              {typeof value === 'number' ? value.toFixed(2) : value}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Financial Analysis */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Financial Analysis</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(comparison.financial).map(([metric, value]) => (
                        <Grid item xs={12} md={4} key={metric}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {metric.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Typography>
                          <Typography variant="h6">
                            {metric.includes('salary') || metric.includes('earnings')
                              ? formatCurrency(value as number)
                              : formatPercentage(value as number)}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Experience Analysis */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Experience Analysis</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(comparison.experience).map(([metric, value]) => (
                        <Grid item xs={12} md={4} key={metric}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {metric.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Typography>
                          <Typography variant="h6">
                            {metric === 'last_active'
                              ? formatDate(value as string)
                              : value}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Role-Specific Analysis */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Role-Specific Analysis</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(comparison.role_specific).map(([role, score]) => (
                        <Grid item xs={12} md={4} key={role}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {role.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box flexGrow={1}>
                              <LinearProgress 
                                variant="determinate" 
                                value={score * 100} 
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                            <Typography variant="body2">
                              {(score as number).toFixed(2)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setComparison(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default PlayerComparison; 