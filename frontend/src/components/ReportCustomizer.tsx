import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  TextField,
  Button,
  Stack,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

interface CustomizationOption {
  id: string;
  label: string;
  description: string;
  type: 'checkbox' | 'slider' | 'text';
  icon: React.ReactNode;
  defaultValue: any;
  category: 'visualization' | 'metrics' | 'format' | 'content';
}

interface ReportCustomizerProps {
  reportType: string;
  onCustomize: (customizations: Record<string, any>) => void;
  onCancel: () => void;
}

const customizationOptions: Record<string, CustomizationOption[]> = {
  playerPerformance: [
    {
      id: 'includeHistoricalData',
      label: 'Historical Performance',
      description: 'Include historical performance data and trends',
      type: 'checkbox',
      icon: <TimelineIcon />,
      defaultValue: true,
      category: 'content',
    },
    {
      id: 'performanceCharts',
      label: 'Performance Charts',
      description: 'Include visual charts for performance metrics',
      type: 'checkbox',
      icon: <BarChartIcon />,
      defaultValue: true,
      category: 'visualization',
    },
    {
      id: 'roleDistribution',
      label: 'Role Distribution',
      description: 'Show role-specific performance breakdown',
      type: 'checkbox',
      icon: <PieChartIcon />,
      defaultValue: true,
      category: 'visualization',
    },
    {
      id: 'detailedStats',
      label: 'Detailed Statistics',
      description: 'Include comprehensive statistical tables',
      type: 'checkbox',
      icon: <TableChartIcon />,
      defaultValue: true,
      category: 'metrics',
    },
    {
      id: 'timeRange',
      label: 'Analysis Period',
      description: 'Number of months to analyze',
      type: 'slider',
      icon: <TimelineIcon />,
      defaultValue: 12,
      category: 'content',
    },
    {
      id: 'notes',
      label: 'Custom Notes',
      description: 'Add your own notes to the report',
      type: 'text',
      icon: <DescriptionIcon />,
      defaultValue: '',
      category: 'content',
    },
  ],
  teamAnalysis: [
    {
      id: 'rosterComposition',
      label: 'Roster Composition',
      description: 'Include detailed roster analysis',
      type: 'checkbox',
      icon: <TableChartIcon />,
      defaultValue: true,
      category: 'content',
    },
    {
      id: 'playerSynergy',
      label: 'Player Synergy',
      description: 'Analyze player combinations and chemistry',
      type: 'checkbox',
      icon: <BarChartIcon />,
      defaultValue: true,
      category: 'metrics',
    },
    {
      id: 'budgetAnalysis',
      label: 'Budget Analysis',
      description: 'Include salary and budget breakdown',
      type: 'checkbox',
      icon: <TableChartIcon />,
      defaultValue: true,
      category: 'metrics',
    },
    {
      id: 'futureProjections',
      label: 'Future Projections',
      description: 'Include team performance projections',
      type: 'checkbox',
      icon: <TimelineIcon />,
      defaultValue: true,
      category: 'content',
    },
  ],
  // Add more report types and their customization options here
};

export const ReportCustomizer: React.FC<ReportCustomizerProps> = ({
  reportType,
  onCustomize,
  onCancel,
}) => {
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  const options = customizationOptions[reportType] || [];

  const handleChange = (optionId: string, value: any) => {
    setCustomizations(prev => ({
      ...prev,
      [optionId]: value,
    }));
  };

  const handleSubmit = () => {
    // Validate required customizations
    const missingRequired = options
      .filter(opt => opt.category === 'metrics')
      .filter(opt => !customizations[opt.id])
      .map(opt => opt.label);

    if (missingRequired.length > 0) {
      setError(`Please select at least one metric: ${missingRequired.join(', ')}`);
      return;
    }

    onCustomize(customizations);
  };

  const renderOption = (option: CustomizationOption) => {
    switch (option.type) {
      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={customizations[option.id] ?? option.defaultValue}
                onChange={(e) => handleChange(option.id, e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="subtitle1">{option.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              </Box>
            }
          />
        );
      case 'slider':
        return (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography gutterBottom>{option.label}</Typography>
            <Slider
              value={customizations[option.id] ?? option.defaultValue}
              onChange={(_, value) => handleChange(option.id, value)}
              min={1}
              max={24}
              marks
              valueLabelDisplay="auto"
            />
            <Typography variant="body2" color="text.secondary">
              {option.description}
            </Typography>
          </Box>
        );
      case 'text':
        return (
          <TextField
            fullWidth
            label={option.label}
            multiline
            rows={3}
            value={customizations[option.id] ?? option.defaultValue}
            onChange={(e) => handleChange(option.id, e.target.value)}
            helperText={option.description}
          />
        );
      default:
        return null;
    }
  };

  const groupedOptions = options.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, CustomizationOption[]>);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Customize Your Report
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Select the options you want to include in your report.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
          <Box key={category}>
            <Typography variant="subtitle1" gutterBottom>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Typography>
            <FormGroup>
              {categoryOptions.map((option) => (
                <Box key={option.id} sx={{ mb: 2 }}>
                  {renderOption(option)}
                </Box>
              ))}
            </FormGroup>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={Object.keys(customizations).length === 0}
        >
          Generate Report
        </Button>
      </Box>
    </Paper>
  );
}; 