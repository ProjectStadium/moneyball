import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import PlayerProfile, { Player } from '../components/PlayerProfile';
import { playerApi } from '../services/api';

const Container = styled.div`
  padding: 20px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #ffffff;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  text-align: center;
  padding: 20px;
  font-size: 1.2rem;
`;

const PlayerProfilePage = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        const response = await playerApi.getPlayerProfile(id!);
        const transformedPlayer: Player = {
          ...response,
          tournament_history: Array.isArray(response.tournament_history) 
            ? response.tournament_history.map(tournament => ({
                name: tournament.name || 'Unknown Tournament',
                date: tournament.date || 'Unknown Date',
                placement: tournament.placement || 'Unknown',
                earnings: tournament.earnings || 0
              }))
            : []
        };
        setPlayer(transformedPlayer);
      } catch (err) {
        setError('Failed to load player data. Please try again later.');
        console.error('Error fetching player:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlayer();
    }
  }, [id]);

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Loading player data...</LoadingSpinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }

  if (!player) {
    return (
      <Container>
        <ErrorMessage>Player not found</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <PlayerProfile player={player} />
    </Container>
  );
};

export default PlayerProfilePage; 