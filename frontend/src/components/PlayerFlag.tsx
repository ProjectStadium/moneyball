import React from 'react';
import '/node_modules/flag-icons/css/flag-icons.min.css';

interface PlayerFlagProps {
  countryCode?: string;
  countryName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

export const PlayerFlag: React.FC<PlayerFlagProps> = ({
  countryCode,
  countryName,
  size = 'md',
  className = ''
}) => {
  if (!countryCode) {
    return null;
  }

  const code = countryCode.toLowerCase();
  
  return (
    <span 
      className={`inline-block ${sizeClasses[size]} ${className}`}
      title={countryName || code}
    >
      <span 
        className={`fi fi-${code}`}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'inline-block',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          verticalAlign: 'middle'
        }}
      />
    </span>
  );
};

// Fallback to image URL if the flag-icons class doesn't work
export const PlayerFlagWithFallback: React.FC<PlayerFlagProps> = (props) => {
  const [useFallback, setUseFallback] = React.useState(false);

  if (!props.countryCode || useFallback) {
    return (
      <img
        src={`https://flagcdn.com/${props.countryCode?.toLowerCase()}.svg`}
        alt={props.countryName || props.countryCode}
        className={`inline-block ${sizeClasses[props.size || 'md']} ${props.className || ''}`}
        onError={() => setUseFallback(true)}
      />
    );
  }

  return <PlayerFlag {...props} />;
}; 