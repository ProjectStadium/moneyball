import React from 'react';
import styled from 'styled-components';
import { Typography } from '@mui/material';
import AgentUsageStats from './AgentUsageStats';

export interface Player {
  id: string;
  name: string;
  player_img_url?: string;
  team_name?: string;
  team_abbreviation?: string;
  country_name?: string;
  country_code?: string;
  // Performance stats
  rating?: number;
  acs?: number;
  kd_ratio?: number;
  adr?: number;
  kpr?: number;
  apr?: number;
  fk_pr?: number;
  fd_pr?: number;
  hs_pct?: number;
  // Agent and role information
  agent_usage?: Record<string, number>;
  roles?: string[];
  primary_role?: string;
  role_distribution?: Record<string, number>;
  // Game stats
  rounds_played?: number;
  clutches_won?: number;
  clutches_played?: number;
  // Status and value
  is_free_agent?: boolean;
  division?: string;
  estimated_value?: number;
  compatibility_score?: number;
  // Tournament and earnings
  total_earnings?: number;
  earnings_by_year?: Record<string, number>;
  tournament_history?: {
    name: string;
    date: string;
    placement: string;
    earnings: number;
  }[];
  last_updated?: string;
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 12px;
`;

const PlayerImage = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.h1`
  color: #ffffff;
  margin: 0 0 10px 0;
  font-size: 2rem;
`;

const PlayerDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const DetailItem = styled.div`
  background-color: #1a1a1a;
  padding: 15px;
  border-radius: 8px;
`;

const DetailLabel = styled.div`
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const DetailValue = styled.div`
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 500;
`;

const Title = styled.h2`
  color: #ffffff;
  margin-bottom: 20px;
  font-size: 1.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

interface PlayerProfileProps {
  player: Player;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player }) => {
  if (!player) {
    return <Container>Loading...</Container>;
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Container>
      <Header>
        <PlayerImage 
          src={player.player_img_url || '/images/default-player.png'} 
          alt={player.name}
          onError={(e) => {
            e.currentTarget.src = '/images/default-player.png';
          }}
        />
        <PlayerInfo>
          <PlayerName>{player.name}</PlayerName>
          <PlayerDetails>
            {/* Basic Info */}
            <DetailItem>
              <DetailLabel>Team</DetailLabel>
              <DetailValue>{player.team_name || 'Free Agent'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Country</DetailLabel>
              <DetailValue>{player.country_name || 'Unknown'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Division</DetailLabel>
              <DetailValue>{player.division || 'Unknown'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Primary Role</DetailLabel>
              <DetailValue>{player.primary_role || 'Unknown'}</DetailValue>
            </DetailItem>

            {/* Performance Stats */}
            <DetailItem>
              <DetailLabel>Rating</DetailLabel>
              <DetailValue>{player.rating?.toFixed(2) || 'N/A'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>ACS</DetailLabel>
              <DetailValue>{player.acs?.toFixed(1) || 'N/A'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>K/D Ratio</DetailLabel>
              <DetailValue>{player.kd_ratio?.toFixed(2) || 'N/A'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>ADR</DetailLabel>
              <DetailValue>{player.adr?.toFixed(1) || 'N/A'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Headshot %</DetailLabel>
              <DetailValue>{player.hs_pct ? `${(player.hs_pct * 100).toFixed(1)}%` : 'N/A'}</DetailValue>
            </DetailItem>

            {/* Clutch Stats */}
            <DetailItem>
              <DetailLabel>Clutches</DetailLabel>
              <DetailValue>
                {player.clutches_won && player.clutches_played 
                  ? `${player.clutches_won}/${player.clutches_played} (${((player.clutches_won / player.clutches_played) * 100).toFixed(1)}%)`
                  : 'N/A'}
              </DetailValue>
            </DetailItem>

            {/* Value and Earnings */}
            <DetailItem>
              <DetailLabel>Estimated Value</DetailLabel>
              <DetailValue>{formatCurrency(player.estimated_value)}/mo</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Total Earnings</DetailLabel>
              <DetailValue>{formatCurrency(player.total_earnings)}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Compatibility Score</DetailLabel>
              <DetailValue>{player.compatibility_score?.toFixed(1) || 'N/A'}</DetailValue>
            </DetailItem>
          </PlayerDetails>
        </PlayerInfo>
      </Header>

      {/* Agent Usage Stats */}
      {player.agent_usage && Object.keys(player.agent_usage).length > 0 && (
        <AgentUsageStats agentUsage={player.agent_usage} />
      )}

      {/* Tournament History */}
      {player.tournament_history && player.tournament_history.length > 0 && (
        <Container>
          <Title>Tournament History</Title>
          <Grid>
            {player.tournament_history.map((tournament, index) => (
              <DetailItem key={index}>
                <DetailLabel>{tournament.date}</DetailLabel>
                <DetailValue>{tournament.name}</DetailValue>
                <DetailValue>Placement: {tournament.placement}</DetailValue>
                <DetailValue>{formatCurrency(tournament.earnings)}</DetailValue>
              </DetailItem>
            ))}
          </Grid>
        </Container>
      )}

      {/* Last Updated */}
      <Typography variant="caption" color="textSecondary">
        Last Updated: {player.last_updated ? new Date(player.last_updated).toLocaleString() : 'Unknown'}
      </Typography>
    </Container>
  );
};

export default PlayerProfile; 