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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon,
  Public as GlobeIcon,
  Groups as TeamsIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { tournamentApi } from '../services/api';

interface Tournament {
  id: string;
  name: string;
  region: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  team_count: number;
  format: string;
  organizer: string;
}

export default function Tournaments() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Tournament>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', page, rowsPerPage, searchTerm, sortField, sortDirection, statusFilter, regionFilter],
    queryFn: () => tournamentApi.getAll({
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search: searchTerm,
      sort_by: sortField,
      sort_order: sortDirection,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      region: regionFilter !== 'all' ? regionFilter : undefined,
    }),
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field: keyof Tournament) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'primary';
      case 'ongoing':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Tournaments</Typography>

      {/* Tournament Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TrophyIcon color="primary" />
                <Typography color="textSecondary">Total Tournaments</Typography>
              </Box>
              <Typography variant="h4">{data?.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <GlobeIcon color="primary" />
                <Typography color="textSecondary">Regions</Typography>
              </Box>
              <Typography variant="h4">{data?.unique_regions || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TeamsIcon color="primary" />
                <Typography color="textSecondary">Participating Teams</Typography>
              </Box>
              <Typography variant="h4">{data?.total_teams || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <MoneyIcon color="primary" />
                <Typography color="textSecondary">Total Prize Pool</Typography>
              </Box>
              <Typography variant="h4">{formatCurrency(data?.total_prize_pool || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="ongoing">Ongoing</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Region</InputLabel>
          <Select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            label="Region"
          >
            <MenuItem value="all">All Regions</MenuItem>
            {data?.regions?.map((region: string) => (
              <MenuItem key={region} value={region}>{region}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          variant="outlined"
          placeholder="Search tournaments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Tournaments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right" onClick={() => handleSort('start_date')} sx={{ cursor: 'pointer' }}>
                Start Date
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('end_date')} sx={{ cursor: 'pointer' }}>
                End Date
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('prize_pool')} sx={{ cursor: 'pointer' }}>
                Prize Pool
              </TableCell>
              <TableCell align="right" onClick={() => handleSort('team_count')} sx={{ cursor: 'pointer' }}>
                Teams
              </TableCell>
              <TableCell>Format</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.tournaments.map((tournament: Tournament) => (
              <TableRow key={tournament.id}>
                <TableCell>{tournament.name}</TableCell>
                <TableCell>
                  <Chip
                    label={tournament.status}
                    color={getStatusColor(tournament.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip label={tournament.region} size="small" />
                </TableCell>
                <TableCell>{tournament.type}</TableCell>
                <TableCell align="right">{formatDate(tournament.start_date)}</TableCell>
                <TableCell align="right">{formatDate(tournament.end_date)}</TableCell>
                <TableCell align="right">{formatCurrency(tournament.prize_pool)}</TableCell>
                <TableCell align="right">{tournament.team_count}</TableCell>
                <TableCell>{tournament.format}</TableCell>
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