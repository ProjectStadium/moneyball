import React from 'react';
import { Box, Typography } from '@mui/material';
import { FreeAgentsList } from '../components/FreeAgentsList';

const FreeAgents: React.FC = () => {
    return (
        <Box>
            <Typography variant="h3" gutterBottom>
                Free Agents Market
            </Typography>
            <Typography variant="body1" paragraph>
                Discover talented players currently available in the Valorant competitive scene.
                Each player's profile includes their performance statistics, tournament history,
                and potential value to organizations.
            </Typography>
            <FreeAgentsList />
        </Box>
    );
};

export default FreeAgents; 