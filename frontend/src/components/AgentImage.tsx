import React from 'react';
import styled from 'styled-components';

interface AgentImageProps {
  agentName: string;
  imageUrl?: string;
  alt?: string;
}

const AgentImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #1a1a1a;
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const AgentName = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
`;

const AgentImage: React.FC<AgentImageProps> = ({ agentName, imageUrl, alt }) => {
  const getAgentImagePath = (name: string) => {
    // Convert agent name to lowercase and replace spaces with hyphens
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/images/agents/${formattedName}.png`;
  };

  const getAgentRole = (name: string) => {
    const roles: Record<string, string> = {
      'astra': 'controller',
      'brimstone': 'controller',
      'omen': 'controller',
      'viper': 'controller',
      'harbor': 'controller',
      'clove': 'controller',
      'jett': 'duelist',
      'phoenix': 'duelist',
      'reyna': 'duelist',
      'raze': 'duelist',
      'yoru': 'duelist',
      'neon': 'duelist',
      'iso': 'duelist',
      'waylay': 'duelist',
      'breach': 'initiator',
      'fade': 'initiator',
      'gekko': 'initiator',
      'kayo': 'initiator',
      'skye': 'initiator',
      'sova': 'initiator',
      'tejo': 'initiator',
      'chamber': 'sentinel',
      'cypher': 'sentinel',
      'killjoy': 'sentinel',
      'sage': 'sentinel',
      'deadlock': 'sentinel',
      'vyse': 'sentinel'
    };
    return roles[name.toLowerCase()] || 'unknown';
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If the provided imageUrl fails, try the local agent image
    if (imageUrl && e.currentTarget.src !== getAgentImagePath(agentName)) {
      e.currentTarget.src = getAgentImagePath(agentName);
    } else {
      // If both fail, use a default agent image based on role
      const role = getAgentRole(agentName);
      e.currentTarget.src = `/images/agents/${role}.png`;
    }
  };

  return (
    <AgentImageContainer>
      <StyledImage
        src={imageUrl || getAgentImagePath(agentName)}
        alt={alt || `${agentName} agent`}
        onError={handleError}
      />
      <AgentName>{agentName}</AgentName>
    </AgentImageContainer>
  );
};

export default AgentImage; 