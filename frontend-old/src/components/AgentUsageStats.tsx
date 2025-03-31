import React from 'react';
import styled from 'styled-components';
import AgentImage from './AgentImage';

interface AgentUsageStatsProps {
  agentUsage?: Record<string, number>;
}

const Container = styled.div`
  padding: 20px;
  background-color: #2a2a2a;
  border-radius: 12px;
  margin: 20px 0;
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

const AgentCard = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const UsagePercentage = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const AgentUsageStats: React.FC<AgentUsageStatsProps> = ({ agentUsage }) => {
  if (!agentUsage || Object.keys(agentUsage).length === 0) {
    return (
      <Container>
        <Title>Agent Usage</Title>
        <p>No agent usage data available</p>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Agent Usage</Title>
      <Grid>
        {Object.entries(agentUsage).map(([agentName, percentage]) => (
          <AgentCard key={agentName}>
            <AgentImage
              agentName={agentName}
            />
            <UsagePercentage>{percentage}%</UsagePercentage>
          </AgentCard>
        ))}
      </Grid>
    </Container>
  );
};

export default AgentUsageStats; 