import React, { useEffect, useState } from 'react';
import { dataIntegrationService, EnrichedPlayerData } from '../services/dataIntegrationService';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Tooltip,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    EmojiEvents as EmojiEventsIcon,
    AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';

export const FreeAgentsList: React.FC = () => {
    const [freeAgents, setFreeAgents] = useState<EnrichedPlayerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFreeAgents = async () => {
            try {
                const data = await dataIntegrationService.getFreeAgents();
                setFreeAgents(data);
            } catch (err) {
                setError('Failed to fetch free agents data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchFreeAgents();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box m={2}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Box p={2}>
            <Typography variant="h4" gutterBottom>
                Free Agents
            </Typography>
            <Grid container spacing={3}>
                {freeAgents.map((agent) => (
                    <Grid item xs={12} sm={6} md={4} key={agent.id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6">
                                        {agent.name}
                                    </Typography>
                                    <Chip 
                                        label="Free Agent" 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined"
                                    />
                                </Box>

                                {agent.country_code && (
                                    <Typography color="textSecondary" gutterBottom>
                                        Country: {agent.country_name || agent.country_code.toUpperCase()}
                                    </Typography>
                                )}

                                <Box mt={2}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Performance Stats
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Tooltip title="Average Combat Score">
                                                <Box display="flex" alignItems="center">
                                                    <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                    <Typography variant="body2">
                                                        ACS: {agent.acs?.toFixed(1) || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Tooltip title="Kill/Death Ratio">
                                                <Typography variant="body2">
                                                    K/D: {agent.kd_ratio?.toFixed(2) || 'N/A'}
                                                </Typography>
                                            </Tooltip>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Tooltip title="Headshot Percentage">
                                                <Typography variant="body2">
                                                    HS%: {agent.hs_pct?.toFixed(1) || 'N/A'}%
                                                </Typography>
                                            </Tooltip>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Tooltip title="Average Damage per Round">
                                                <Typography variant="body2">
                                                    ADR: {agent.adr?.toFixed(1) || 'N/A'}
                                                </Typography>
                                            </Tooltip>
                                        </Grid>
                                    </Grid>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Additional Information
                                    </Typography>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <EmojiEventsIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        <Typography variant="body2">
                                            Division: {agent.division}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center">
                                        <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        <Typography variant="body2">
                                            Total Earnings: {formatCurrency(agent.earnings)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}; 