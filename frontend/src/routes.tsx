import React from 'react';
import { RouteObject } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Teams from './pages/Teams';
// import Tournaments from './pages/Tournaments';
import Analysis from './pages/Analysis';
import FreeAgents from './pages/FreeAgents';
import RosterBuilder from './pages/RosterBuilder';
import Layout from './components/Layout';
import PlayerComparison from './pages/PlayerComparison';
import { Reports } from './pages/Reports';
import { NotFound } from './pages/NotFound';
import { PaymentSuccess } from './pages/PaymentSuccess';
import PlayerProfilePage from './pages/PlayerProfile';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'players',
        children: [
          {
            index: true,
            element: <Players />,
          },
          {
            path: ':id',
            element: <PlayerProfilePage />,
          },
        ],
      },
      {
        path: 'teams',
        children: [
          {
            index: true,
            element: <Teams />,
          },
          {
            path: ':id',
            element: <div>Team Profile (TODO)</div>,
          },
        ],
      },
      // {
      //   path: 'tournaments',
      //   children: [
      //     {
      //       index: true,
      //       element: <Tournaments />,
      //     },
      //     {
      //       path: ':id',
      //       element: <div>Tournament Details (TODO)</div>,
      //     },
      //     {
      //       path: ':id/standings',
      //       element: <div>Tournament Standings (TODO)</div>,
      //     },
      //   ],
      // },
      {
        path: 'analysis',
        children: [
          {
            index: true,
            element: <Analysis />,
          },
          {
            path: 'free-agents',
            element: <FreeAgents />,
          },
          {
            path: 'roster-builder',
            element: <RosterBuilder />,
          },
          {
            path: 'player-comparison',
            element: <PlayerComparison />,
          },
        ],
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'payment-success',
        element: <PaymentSuccess />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]; 