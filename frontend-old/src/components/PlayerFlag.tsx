import React from 'react';
import { Box, Tooltip } from '@mui/material';

interface PlayerFlagProps {
  countryCode: string;
  countryName: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayerFlag: React.FC<PlayerFlagProps> = ({ countryCode, countryName, size = 'md' }) => {
  const getSize = () => {
    switch (size) {
      case 'sm':
        return '24px';
      case 'md':
        return '32px';
      case 'lg':
        return '48px';
      default:
        return '32px';
    }
  };

  return (
    <Tooltip title={countryName}>
      <Box
        component="img"
        src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
        srcSet={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png 2x`}
        alt={`${countryName} flag`}
        sx={{
          width: getSize(),
          height: getSize(),
          objectFit: 'cover',
          borderRadius: '4px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      />
    </Tooltip>
  );
};

export const PlayerFlagWithFallback: React.FC<PlayerFlagProps> = ({ countryCode, countryName, size }) => {
  if (!countryCode) {
    return (
      <Tooltip title="Unknown country">
        <Box
          sx={{
            width: getSize(),
            height: getSize(),
            backgroundColor: 'grey.200',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          🌐
        </Box>
      </Tooltip>
    );
  }

  return <PlayerFlag countryCode={countryCode} countryName={countryName} size={size} />;
}; 