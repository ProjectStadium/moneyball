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
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Calculate as CalculateIcon,
  EmojiEvents as TrophyIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { analysisApi, playerApi } from '../services/api';

interface Player {
  id: string;
  name: string;
  region: string;
  competitive_tier: string;
  agent_types: string[];
  rating: number;
  estimated_salary: number;
  tournament_experience: number;
}

interface RosterSlot {
  role: string;
  player: Player | null;
}

interface RosterAnalysis {
  total_salary: number;
  average_rating: number;
  total_experience: number;
  win_probability: number;
  synergy_score: number;
  role_balance: {
    [key: string]: number;
  };
}

const ROLES = [
  { id: 'duelist1', name: 'Duelist 1' },
  { id: 'duelist2', name: 'Duelist 2' },
  { id: 'controller', name: 'Controller' },
  { id: 'sentinel', name: 'Sentinel' },
  { id: 'initiator', name: 'Initiator' },
];

export default function RosterBuilder() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterSlot[]>(
    ROLES.map(role => ({ role: role.id, player: null }))
  );
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);

  const { data: freeAgents, isLoading } = useQuery({
    queryKey: ['freeAgents', searchTerm],
    queryFn: () => analysisApi.getFreeAgentMarket({
      search: searchTerm,
      limit: 10,
    }),
  });

  const { data: analysis, isLoading: isLoadingAnalysis } = useQuery({
    queryKey: ['rosterAnalysis', roster],
    queryFn: () => analysisApi.generateOptimalRoster({
      players: roster.map(slot => slot.player?.id).filter(Boolean),
    }),
    enabled: roster.every(slot => slot.player !== null),
  });

  const handlePlayerSelect = (player: Player) => {
    if (!selectedRole) return;

    setRoster(prev => prev.map(slot => 
      slot.role === selectedRole ? { ...slot, player } : slot
    ));
    setSelectedRole(null);
    setSearchTerm('');
  };

  const handleRemovePlayer = (role: string) => {
    setRoster(prev => prev.map(slot => 
      slot.role === role ? { ...slot, player: null } : slot
    ));
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Roster Builder</Typography>

      {/* Roster Slots */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {roster.map((slot) => (
          <Grid item xs={12} md={4} key={slot.role}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    {ROLES.find(r => r.id === slot.role)?.name}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setSelectedRole(slot.role)}
                  >
                    Add Player
                  </Button>
                </Box>
                {slot.player ? (
                  <Box mt={2}>
                    <Typography variant="subtitle1">{slot.player.name}</Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip 
                        label={slot.player.region} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={slot.player.competitive_tier} 
                        size="small" 
                        color="primary" 
                      />
                    </Box>
                    <Box display="flex" gap={1} mt={1}>
                      {slot.player.agent_types.map((agent, index) => (
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
                        Rating: {slot.player.rating.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatCurrency(slot.player.estimated_salary)}
                      </Typography>
                    </Box>
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      startIcon={<RemoveIcon />}
                      onClick={() => handleRemovePlayer(slot.role)}
                      sx={{ mt: 1 }}
                    >
                      Remove
                    </Button>
                  </Box>
                ) : (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center" 
                    height={100}
                    border="1px dashed"
                    borderColor="divider"
                    borderRadius={1}
                  >
                    <Typography color="textSecondary">
                      No player selected
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Analysis Button */}
      {roster.every(slot => slot.player !== null) && (
        <Box display="flex" justifyContent="center" mb={4}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CalculateIcon />}
            onClick={() => setAnalysisDialogOpen(true)}
          >
            Analyze Roster
          </Button>
        </Box>
      )}

      {/* Player Selection Dialog */}
      <Dialog
        open={!!selectedRole}
        onClose={() => setSelectedRole(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Select Player for {ROLES.find(r => r.id === selectedRole)?.name}
        </DialogTitle>
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
                  disabled={roster.some(slot => slot.player?.id === player.id)}
                >
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
          <Button onClick={() => setSelectedRole(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Roster Analysis Dialog */}
      <Dialog
        open={analysisDialogOpen}
        onClose={() => setAnalysisDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Roster Analysis</DialogTitle>
        <DialogContent>
          {isLoadingAnalysis ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <MoneyIcon color="primary" />
                      <Typography variant="h6">Financial Analysis</Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom>
                      {formatCurrency(analysis?.total_salary || 0)}
                    </Typography>
                    <Typography color="textSecondary">
                      Monthly Roster Cost
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <TrophyIcon color="primary" />
                      <Typography variant="h6">Performance Metrics</Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom>
                      {formatPercentage(analysis?.win_probability || 0)}
                    </Typography>
                    <Typography color="textSecondary">
                      Estimated Win Probability
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Team Composition</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Average Rating
                        </Typography>
                        <Typography variant="h5">
                          {(analysis?.average_rating || 0).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Total Experience
                        </Typography>
                        <Typography variant="h5">
                          {analysis?.total_experience || 0} years
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Synergy Score
                        </Typography>
                        <Typography variant="h5">
                          {(analysis?.synergy_score || 0).toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Role Balance</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(analysis?.role_balance || {}).map(([role, score]) => (
                        <Grid item xs={12} md={4} key={role}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Typography>
                          <Typography variant="h5">
                            {(score as number).toFixed(2)}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalysisDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 