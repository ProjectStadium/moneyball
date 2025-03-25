import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { playerApi } from '../services/api';
import { PlayerFlagWithFallback } from '../components/PlayerFlag';
import { useSearchParams } from 'react-router-dom';

interface Player {
  id: string;
  name: string;
  full_identifier?: string;
  team_abbreviation?: string;
  team_name?: string;
  division: string;
  rating: number;
  acs?: number;
  kd_ratio: number;
  hs_pct?: number;
  fk_pr?: number;
  clutch_percentage?: number;
  win_rate: number;
  total_earnings?: number;
  country_code: string;
  country: string;
  is_free_agent: boolean;
  vlr_stats?: {
    acs: number;
    kd: number;
    hs_percentage: number;
    fb_percentage: number;
  };
  tournament_history?: {
    total_earnings: number;
    estimated_value: number;
  };
}

export default function Players() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Player>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFreeAgents, setShowFreeAgents] = useState(searchParams.get('filter') === 'free-agents');

  const { data, isLoading, error } = useQuery({
    queryKey: ['players', page, rowsPerPage, searchTerm, sortField, sortDirection, showFreeAgents],
    queryFn: () => playerApi.getAll({
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      name: searchTerm,
      ...(showFreeAgents ? { is_free_agent: 'true' } : {}),
      order: JSON.stringify([[sortField, sortDirection]]),
    }),
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {showFreeAgents ? 'Free Agents' : 'Players'}
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={showFreeAgents ? 'free-agents' : 'all'}
              onChange={handleFilterChange}
              label="Filter"
            >
              <MenuItem value="all">All Players</MenuItem>
              <MenuItem value="free-agents">Free Agents</MenuItem>
            </Select>
          </FormControl>
          <TextField
            variant="outlined"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Division</TableCell>
              <TableCell align="right" onClick={() => handleSort('rating')} sx={{ cursor: 'pointer' }}>
                Rating
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('kd_ratio')} sx={{ cursor: 'pointer' }}>
                K/D Ratio
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('hs_pct')} sx={{ cursor: 'pointer' }}>
                HS%
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('fk_pr')} sx={{ cursor: 'pointer' }}>
                FK%
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('clutch_percentage')} sx={{ cursor: 'pointer' }}>
                Clutch%
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('acs')} sx={{ cursor: 'pointer' }}>
                ACS
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('win_rate')} sx={{ cursor: 'pointer' }}>
                Win Rate
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('total_earnings')} sx={{ cursor: 'pointer' }}>
                Earnings
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} align="center">
                  <Typography color="textSecondary">
                    {searchTerm ? 'No players found matching your search.' : 'No players available.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              players.map((player: Player) => {
                // Extract team abbreviation from name if it exists
                const teamMatch = player.name.match(/\s+\|?\s*([A-Z0-9.]+)$/);
                const extractedTeamAbbr = teamMatch ? teamMatch[1] : null;
                
                // Determine if player is actually a free agent
                const isActuallyFreeAgent = !extractedTeamAbbr && !player.team_abbreviation;
                
                // Clean up the name by removing the team abbreviation
                const cleanName = player.name.replace(/\s+\|?\s*[A-Z0-9.]+$/, '').trim();
                
                return (
                  <TableRow key={player.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PlayerFlagWithFallback 
                          countryCode={player.country_code}
                          countryName={player.country}
                          size="sm"
                        />
                        {cleanName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={player.team_abbreviation || extractedTeamAbbr || 'unsigned'}
                        color={isActuallyFreeAgent ? 'default' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isActuallyFreeAgent ? 'Free Agent' : 'Signed'}
                        color={isActuallyFreeAgent ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{player.division}</TableCell>
                    <TableCell align="right">{formatNumber(player.rating)}</TableCell>
                    <TableCell align="right">{formatNumber(player.kd_ratio)}</TableCell>
                    <TableCell align="right">{formatPercentage(player.hs_pct)}</TableCell>
                    <TableCell align="right">{formatPercentage(player.fk_pr)}</TableCell>
                    <TableCell align="right">{formatPercentage(player.clutch_percentage)}</TableCell>
                    <TableCell align="right">{formatNumber(player.acs, 1)}</TableCell>
                    <TableCell align="right">{formatPercentage(player.win_rate)}</TableCell>
                    <TableCell align="right">{formatCurrency(player.total_earnings)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
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