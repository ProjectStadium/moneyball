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
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { teamApi } from '../services/api';

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  region: string;
  rank: number;
  roster_size: number;
  total_earnings: number;
  win_rate: number;
  average_rating: number;
  tournament_wins: number;
  tournament_placements: number;
}

export default function Teams() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Team>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading } = useQuery({
    queryKey: ['teams', page, rowsPerPage, searchTerm, sortField, sortDirection],
    queryFn: () => teamApi.getAll({
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search: searchTerm,
      sort_by: sortField,
      sort_order: sortDirection,
    }),
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field: keyof Team) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Teams</Typography>

      {/* Team Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <GroupIcon color="primary" />
                <Typography color="textSecondary">Total Teams</Typography>
              </Box>
              <Typography variant="h4">{data?.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TrophyIcon color="primary" />
                <Typography color="textSecondary">Active Tournaments</Typography>
              </Box>
              <Typography variant="h4">{data?.active_tournaments || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TimelineIcon color="primary" />
                <Typography color="textSecondary">Average Rating</Typography>
              </Box>
              <Typography variant="h4">{data?.average_team_rating?.toFixed(2) || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <GroupIcon color="primary" />
                <Typography color="textSecondary">Average Roster Size</Typography>
              </Box>
              <Typography variant="h4">{data?.average_roster_size?.toFixed(1) || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Box display="flex" justifyContent="flex-end" mb={3}>
        <TextField
          variant="outlined"
          placeholder="Search teams..."
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

      {/* Teams Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Region</TableCell>
              <TableCell align="right" onClick={() => handleSort('rank')} sx={{ cursor: 'pointer' }}>
                Rank
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('roster_size')} sx={{ cursor: 'pointer' }}>
                Roster Size
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('win_rate')} sx={{ cursor: 'pointer' }}>
                Win Rate
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('average_rating')} sx={{ cursor: 'pointer' }}>
                Avg Rating
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('tournament_wins')} sx={{ cursor: 'pointer' }}>
                Tournament Wins
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('total_earnings')} sx={{ cursor: 'pointer' }}>
                Total Earnings
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.teams.map((team: Team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {team.name}
                    <Chip label={team.abbreviation} size="small" />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={team.region} color="primary" size="small" />
                </TableCell>
                <TableCell align="right">#{team.rank}</TableCell>
                <TableCell align="right">{team.roster_size}</TableCell>
                <TableCell align="right">{formatPercentage(team.win_rate)}</TableCell>
                <TableCell align="right">{team.average_rating.toFixed(2)}</TableCell>
                <TableCell align="right">{team.tournament_wins}</TableCell>
                <TableCell align="right">{formatCurrency(team.total_earnings)}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={data?.total || 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
} 