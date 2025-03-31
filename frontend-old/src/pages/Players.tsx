import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  TablePagination,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { playerApi } from '../services/api';
import { PlayerFlagWithFallback } from '../components/PlayerFlag';
import { useSearchParams, useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';

interface Player {
  id: string;
  name: string;
  full_identifier: string;
  player_img_url: string | null;
  team_name: string;
  team_abbreviation: string;
  team_logo_url: string | null;
  country_name: string | null;
  country_code: string;
  is_free_agent: boolean;
  acs: number;
  kd_ratio: number;
  adr: number;
  kpr: number;
  apr: number;
  fk_pr: number;
  fd_pr: number;
  hs_pct: number;
  rating: number;
  agent_usage: string | string[];
  playstyle: string | Record<string, any>;
  division: string;
  division_details: {
    current_division: string;
    consistency_score: number;
    tournaments_at_current_division: number;
    last_division_change: string | null;
    division_history: any[];
    highest_division_achieved: string;
    notes: string | null;
  };
  estimated_value: number | null;
  tournament_history: any[];
  last_updated: string;
  total_earnings: number | null;
  earnings_by_year: Record<string, number>;
  tournament_earnings: any[];
  earnings_last_updated: string | null;
  source: string;
  current_act: string | null;
  leaderboard_rank: number | null;
  ranked_rating: number | null;
  number_of_wins: number | null;
  role_performance?: {
    rps: number;
    sdiff: number;
    confidence: {
      score: number;
      level: 'high' | 'medium' | 'low';
      issues: string[];
    };
  };
  created_at: string;
  updated_at: string;
}

// Color constants for playstyles
const PLAYSTYLE_COLORS = {
  'Fragger': '#ff4444', // red
  'In-Game Leader': '#2196f3', // blue
  'Support': '#4caf50', // green
  'Anchor': '#424242', // charcoal
  'Lurker': '#9c27b0', // purple
  'Flanker': '#673ab7', // deep purple
  'Info Gatherer': '#00bcd4', // cyan
  'Flex': '#ffd700', // gold
  'Entry': '#ff9800', // orange
  'Utility Master': '#009688', // teal
  'Clutch Master': '#795548' // brown
} as const;

// Add this after the PLAYSTYLE_COLORS constant
const REGION_MAPPING: Record<string, string[]> = {
  'NA': ['US', 'CA', 'MX'],
  'EMEA': ['GB', 'DE', 'FR', 'ES', 'IT', 'SE', 'DK', 'NO', 'FI', 'PL', 'NL', 'BE', 'CH', 'AT', 'PT', 'IE', 'GR', 'HU', 'CZ', 'SK', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'CY', 'LU', 'MT'],
  'BR': ['BR'],
  'APAC': ['KR', 'JP', 'CN', 'TW', 'HK', 'SG', 'AU', 'NZ', 'ID', 'MY', 'PH', 'TH', 'VN', 'IN', 'PK', 'BD', 'LK', 'MM', 'KH', 'LA'],
  'KR': ['KR'],
  'CN': ['CN'],
  'JP': ['JP'],
  'LATAM-N': ['MX', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA'],
  'LATAM-S': ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY'],
  'OCE': ['AU', 'NZ'],
};

// Add this after the REGION_MAPPING constant
const AGENT_ROLES: Record<string, string> = {
  'astra': 'Controller',
  'brimstone': 'Controller',
  'harbor': 'Controller',
  'omen': 'Controller',
  'viper': 'Controller',
  'breach': 'Initiator',
  'fade': 'Initiator',
  'gekko': 'Initiator',
  'kayo': 'Initiator',
  'skye': 'Initiator',
  'sova': 'Initiator',
  'chamber': 'Sentinel',
  'cypher': 'Sentinel',
  'deadlock': 'Sentinel',
  'killjoy': 'Sentinel',
  'sage': 'Sentinel',
  'jett': 'Duelist',
  'neon': 'Duelist',
  'phoenix': 'Duelist',
  'raze': 'Duelist',
  'reyna': 'Duelist',
  'yoru': 'Duelist',
  'iso': 'Duelist'
};

interface SortableTableHeaderProps {
  field: keyof Player;
  label: string;
  tooltip: string;
  currentSort: keyof Player;
  currentDirection: 'asc' | 'desc';
  onSort: (field: keyof Player) => void;
}

const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  field,
  label,
  tooltip,
  currentSort,
  currentDirection,
  onSort,
}) => (
  <TableCell
    align="right"
    onClick={() => onSort(field)}
    sx={{ cursor: 'pointer' }}
  >
    <Tooltip title={tooltip}>
      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
        {label}
        {currentSort === field && (
          currentDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
        )}
      </Box>
    </Tooltip>
  </TableCell>
);

const determineRole = (player: Player) => {
  try {
    const agentUsage = typeof player.agent_usage === 'string' 
      ? JSON.parse(player.agent_usage) 
      : player.agent_usage || [];
    
    if (!Array.isArray(agentUsage) || agentUsage.length === 0) {
      return 'Unknown';
    }

    const roleMap: { [key: string]: string } = {
      'jett': 'Duelist',
      'raze': 'Duelist',
      'reyna': 'Duelist',
      'phoenix': 'Duelist',
      'yoru': 'Duelist',
      'neon': 'Duelist',
      'iso': 'Duelist',
      'omen': 'Controller',
      'viper': 'Controller',
      'brimstone': 'Controller',
      'astra': 'Controller',
      'harbor': 'Controller',
      'sova': 'Initiator',
      'breach': 'Initiator',
      'skye': 'Initiator',
      'kayo': 'Initiator',
      'fade': 'Initiator',
      'gekko': 'Initiator',
      'cypher': 'Sentinel',
      'sage': 'Sentinel',
      'killjoy': 'Sentinel',
      'chamber': 'Sentinel',
      'deadlock': 'Sentinel'
    };

    const roles = agentUsage.map(agent => roleMap[agent.toLowerCase()]).filter(Boolean);
    if (roles.length === 0) return 'Unknown';
    
    // Count role occurrences
    const roleCounts = roles.reduce((acc, role) => {
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Find most common role
    return Object.entries(roleCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  } catch (error) {
    console.error('Error determining role:', error);
    return 'Unknown';
  }
};

const determinePlaystyle = (player: Player) => {
  try {
    const playstyle = typeof player.playstyle === 'string' 
      ? JSON.parse(player.playstyle) 
      : player.playstyle || {};
    
    // Parse agent usage
    const agentUsage = typeof player.agent_usage === 'string'
      ? JSON.parse(player.agent_usage)
      : player.agent_usage || [];

    // Check for flex player first based on agent diversity
    const uniqueAgents = Array.isArray(agentUsage) ? new Set(agentUsage).size : 0;
    const agentRoles = Array.isArray(agentUsage) 
      ? agentUsage.map(agent => AGENT_ROLES[agent.toLowerCase()]).filter(Boolean)
      : [];
    const uniqueRoles = new Set(agentRoles).size;

    // Determine if player is flex based on:
    // 1. Plays 3+ different agents OR
    // 2. Plays agents from 2+ different roles with good stats
    const isFlexPlayer = uniqueAgents >= 3 || (
      uniqueRoles >= 2 && 
      player.rating >= 1.0 && 
      player.kd_ratio >= 1.0
    );

    if (typeof playstyle !== 'object' || Object.keys(playstyle).length === 0) {
      // If no playstyle data, determine based on role and stats
      const role = determineRole(player);
      const traits = [];
      
      // Add Flex trait first if applicable
      if (isFlexPlayer) {
        traits.push('Flex');
      }

      // Then add role-specific trait
      switch (role) {
        case 'Duelist':
          traits.push(player.fk_pr > 0.3 ? 'Entry' : 'Fragger');
          if (player.clutch_success_rate > 0.5) traits.push('Clutch Master');
          break;
        case 'Controller':
          traits.push(player.kpr > 0.7 ? 'In-Game Leader' : 'Support');
          if (player.utility_effectiveness > 0.6) traits.push('Utility Master');
          break;
        case 'Initiator':
          traits.push(player.fk_pr > 0.25 ? 'Info Gatherer' : 'Support');
          if (player.recon_efficiency > 0.6) traits.push('Info Gatherer');
          break;
        case 'Sentinel':
          traits.push(player.kd_ratio > 1.2 ? 'Anchor' : 'Support');
          if (player.post_plant_success > 0.5) traits.push('Anchor');
          break;
      }
      return traits.slice(0, 2);
    }

    // If we have playstyle data, use it but ensure flex is considered
    if (playstyle.traits && Array.isArray(playstyle.traits)) {
      const traits = playstyle.traits.map(trait => 
        typeof trait === 'object' ? trait.name : trait
      );
      
      // Add Flex trait if applicable and not already present
      if (isFlexPlayer && !traits.includes('Flex')) {
        traits.unshift('Flex');
      }
      
      return traits.slice(0, 2);
    }

    // Fallback to role-based determination
    const role = determineRole(player);
    const traits = [];
    
    // Add Flex trait first if applicable
    if (isFlexPlayer) {
      traits.push('Flex');
    }
    
    // Add role-based trait
    const roleTraits = {
      'Duelist': ['Entry', 'Fragger'],
      'Controller': ['In-Game Leader', 'Support'],
      'Initiator': ['Info Gatherer', 'Support'],
      'Sentinel': ['Anchor', 'Support']
    };
    
    traits.push(roleTraits[role]?.[0] || 'Unknown');
    
    return traits.slice(0, 2);
  } catch (error) {
    console.error('Error determining playstyle:', error);
    return ['Unknown'];
  }
};

// Add D/MAP calculation
const calculateDeathsPerMap = (player: Player) => {
  try {
    const tournamentHistory = Array.isArray(player.tournament_history) 
      ? player.tournament_history 
      : [];
    
    if (tournamentHistory.length === 0) return 0;
    
    const totalDeaths = tournamentHistory.reduce((sum, match) => 
      sum + (match.deaths || 0), 0);
    const totalMaps = tournamentHistory.reduce((sum, match) => 
      sum + (match.maps_played || 1), 0);
    
    return totalMaps > 0 ? totalDeaths / totalMaps : 0;
  } catch (error) {
    console.error('Error calculating deaths per map:', error);
    return 0;
  }
};

export default function Players() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedPlaystyle, setSelectedPlaystyle] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Player>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFreeAgents, setShowFreeAgents] = useState(searchParams.get('filter') === 'free-agents');

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
      setPage(0); // Reset to first page when searching
    }, 300),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setPage(0);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['players', page, rowsPerPage, debouncedSearchTerm, selectedRegion, selectedDivision, selectedPlaystyle],
    queryFn: () => {
      const params: any = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        name: debouncedSearchTerm,
        division: selectedDivision !== 'all' ? selectedDivision : undefined,
        playstyle: selectedPlaystyle !== 'all' ? selectedPlaystyle : undefined,
      };

      // Handle region filtering
      if (selectedRegion !== 'all') {
        const countryCodes = REGION_MAPPING[selectedRegion];
        if (countryCodes) {
          params.country_codes = countryCodes;
        }
      }

      return playerApi.getAll(params);
    },
  });

  const players = data?.data || [];
  const totalCount = data?.total || 0;

  // Debug logging
  console.log('API Response:', data);
  console.log('Players:', players);
  console.log('Total Count:', totalCount);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRegionChange = (event: SelectChangeEvent) => {
    setSelectedRegion(event.target.value);
    setPage(0);
  };

  const handleDivisionChange = (event: SelectChangeEvent) => {
    setSelectedDivision(event.target.value);
    setPage(0);
  };

  const handlePlaystyleChange = (event: SelectChangeEvent) => {
    setSelectedPlaystyle(event.target.value);
    setPage(0);
  };

  const handleSort = (field: keyof Player) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (event: SelectChangeEvent<'free-agents' | 'all'>) => {
    const value = event.target.value;
    setShowFreeAgents(value === 'free-agents');
    setSearchParams(value === 'free-agents' ? { filter: 'free-agents' } : {});
    setPage(0);
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.0%';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatNumber = (value: number | null | undefined, decimals: number = 2) => {
    if (value === null || value === undefined) return '0.00';
    return value.toFixed(decimals);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '$0';
    return `$${value.toLocaleString()}`;
  };

  if (error) {
    console.error('Error loading players:', error);
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">
          Error loading players. Please try again later.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Players</Typography>

      {/* Filters and Search */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Region</InputLabel>
            <Select
              value={selectedRegion}
              onChange={handleRegionChange}
              label="Region"
            >
              <MenuItem value="all">All Regions</MenuItem>
              <MenuItem value="NA">North America (NA)</MenuItem>
              <MenuItem value="EMEA">Europe (EMEA)</MenuItem>
              <MenuItem value="BR">Brazil</MenuItem>
              <MenuItem value="APAC">Asia-Pacific (APAC)</MenuItem>
              <MenuItem value="KR">Korea</MenuItem>
              <MenuItem value="CN">China</MenuItem>
              <MenuItem value="JP">Japan</MenuItem>
              <MenuItem value="LATAM-N">LATAM - North</MenuItem>
              <MenuItem value="LATAM-S">LATAM - South</MenuItem>
              <MenuItem value="OCE">Oceania</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Division</InputLabel>
            <Select
              value={selectedDivision}
              onChange={handleDivisionChange}
              label="Division"
            >
              <MenuItem value="all">All Divisions</MenuItem>
              <MenuItem value="T1">Tier 1</MenuItem>
              <MenuItem value="T2">Tier 2</MenuItem>
              <MenuItem value="T3">Tier 3</MenuItem>
              <MenuItem value="T4">Tier 4</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Playstyle</InputLabel>
            <Select
              value={selectedPlaystyle}
              onChange={handlePlaystyleChange}
              label="Playstyle"
            >
              <MenuItem value="all">All Playstyles</MenuItem>
              <MenuItem value="Entry">Entry</MenuItem>
              <MenuItem value="Fragger">Fragger</MenuItem>
              <MenuItem value="In-Game Leader">In-Game Leader</MenuItem>
              <MenuItem value="Support">Support</MenuItem>
              <MenuItem value="Anchor">Anchor</MenuItem>
              <MenuItem value="Lurker">Lurker</MenuItem>
              <MenuItem value="Flanker">Flanker</MenuItem>
              <MenuItem value="Info Gatherer">Info Gatherer</MenuItem>
              <MenuItem value="Flex">Flex</MenuItem>
              <MenuItem value="Utility Master">Utility Master</MenuItem>
              <MenuItem value="Clutch Master">Clutch Master</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search players..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {/* Players Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Player</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Playstyle</TableCell>
              <SortableTableHeader
                field="kd_ratio"
                label="KDA"
                tooltip="Kills, Deaths, and Assists per round"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTableHeader
                field="kd_ratio"
                label="KD"
                tooltip="Kills to Deaths ratio"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTableHeader
                field="acs"
                label="ACS"
                tooltip="Average Combat Score"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTableHeader
                field="kd_ratio"
                label="D/MAP"
                tooltip="Deaths per Map"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTableHeader
                field="rating"
                label="Role Performance"
                tooltip="Performance score based on role-specific metrics"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTableHeader
                field="rating"
                label="Skill Differential"
                tooltip="Difference in performance compared to role average"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
            </TableRow>
          </TableHead>
          <TableBody>
            {players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="textSecondary">
                    {searchTerm ? 'No players found matching your search.' : 'No players available.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              players.map((player: Player) => (
                <TableRow 
                  key={player.id}
                  hover
                  onClick={() => navigate(`/players/${player.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PlayerFlagWithFallback 
                        countryCode={player.country_code}
                        countryName={player.country_name}
                        size="sm"
                      />
                      {player.name}
                    </Box>
                  </TableCell>
                  <TableCell>{determineRole(player)}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {determinePlaystyle(player).map((trait, index) => (
                        <Chip
                          key={index}
                          label={trait}
                          size="small"
                          sx={{
                            backgroundColor: PLAYSTYLE_COLORS[trait as keyof typeof PLAYSTYLE_COLORS] || 'default',
                            color: 'white',
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatNumber(player.kd_ratio)}</TableCell>
                  <TableCell align="right">{formatNumber(player.kd_ratio)}</TableCell>
                  <TableCell align="right">{formatNumber(player.acs, 1)}</TableCell>
                  <TableCell align="right">{formatNumber(calculateDeathsPerMap(player), 1)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={`Confidence: ${player.role_performance?.confidence?.level || 'N/A'}`}>
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                        {player.role_performance?.rps ? player.role_performance.rps.toFixed(1) : '-'}
                        {player.role_performance?.confidence?.level === 'high' && (
                          <Chip
                            size="small"
                            color="success"
                            label="High"
                            sx={{ height: 20 }}
                          />
                        )}
                        {player.role_performance?.confidence?.level === 'medium' && (
                          <Chip
                            size="small"
                            color="warning"
                            label="Medium"
                            sx={{ height: 20 }}
                          />
                        )}
                        {player.role_performance?.confidence?.level === 'low' && (
                          <Chip
                            size="small"
                            color="error"
                            label="Low"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={`SDIFF: ${player.role_performance?.sdiff ? (player.role_performance.sdiff > 0 ? '+' : '') + player.role_performance.sdiff.toFixed(1) : 'N/A'}`}>
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                        {player.role_performance?.sdiff ? (
                          <Typography
                            color={player.role_performance.sdiff > 0 ? 'success.main' : player.role_performance.sdiff < 0 ? 'error.main' : 'text.primary'}
                          >
                            {player.role_performance.sdiff > 0 ? '+' : ''}{player.role_performance.sdiff.toFixed(1)}
                          </Typography>
                        ) : '-'}
                      </Box>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
} 