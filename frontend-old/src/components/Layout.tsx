import React, { ReactNode, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Collapse,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon,
  Analytics as AnalyticsIcon,
  People as PeopleIcon,
  Build as BuildIcon,
  ExpandLess,
  ExpandMore,
  Groups as GroupsIcon,
  Assessment as AssessmentIcon,
  Description as ReportIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Players', icon: <PeopleIcon />, path: '/players' },
  { text: 'Teams', icon: <GroupsIcon />, path: '/teams' },
  {
    text: 'Analysis',
    icon: <AnalyticsIcon />,
    path: '/analysis',
    subItems: [
      { text: 'Market Analysis', path: '/analysis' },
      { text: 'Free Agents', path: '/analysis/free-agents' },
      { text: 'Roster Builder', path: '/analysis/roster-builder' },
      { text: 'Player Comparison', path: '/analysis/player-comparison' },
    ],
  },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAnalysisClick = () => {
    setAnalysisOpen(!analysisOpen);
  };

  const isActive = (path: string) => location.pathname === path;
  const isAnalysisActive = () => location.pathname.startsWith('/analysis');

  const drawer = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap>
          MoneyBall
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            {item.subItems ? (
              <>
                <ListItemButton
                  selected={isAnalysisActive()}
                  onClick={handleAnalysisClick}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {analysisOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={analysisOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItemButton
                        key={subItem.text}
                        selected={isActive(subItem.path)}
                        onClick={() => {
                          navigate(subItem.path);
                          if (isMobile) {
                            handleDrawerToggle();
                          }
                        }}
                        sx={{ pl: 4 }}
                      >
                        <ListItemText primary={subItem.text} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      handleDrawerToggle();
                    }
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {menuItems.find(item => item.path === location.pathname)?.text || 
             menuItems.find(item => item.subItems?.some(sub => sub.path === location.pathname))?.text || 
             'MoneyBall'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
} 