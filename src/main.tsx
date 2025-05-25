import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import App from './App';
import Layout from './layouts/dashboard';
import DashboardPage from './pages';
import SignInPage from './pages/signin';
import SpellChecksPage from "./pages/SpellChecks";
import ViewCheck from './pages/ViewCheck';
import StatisticsPage from './pages/Statistics';
import RandomCheckPage from './pages/RandomCheck';
import RandomExpiringCheckPage from './pages/RandomExpiringCheck';
import LongestErrorFreeCheckPage from './pages/LongestErrorFreeCheck';
import './i18n'; // Import i18n configuration

const router = createBrowserRouter([
  {
    path: '/view_check',
    element: <ViewCheck />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            path: '',
            element: <DashboardPage />,
          },
          {
            path: 'checks',
            element: <SpellChecksPage />,
          },
          {
            path: 'statistics',
            element: <StatisticsPage />,
          },
          {
            path: 'random',
            element: <RandomCheckPage />,
          },
          {
            path: 'random-expiring',
            element: <RandomExpiringCheckPage />,
          },
          {
            path: 'longest-error-free',
            element: <LongestErrorFreeCheckPage />,
          },
        ],
      },
      {
        path: '/sign-in',
        element: <SignInPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);

