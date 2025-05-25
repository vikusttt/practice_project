import * as React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { Outlet, Navigate, useLocation } from 'react-router';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import { Account } from '@toolpad/core/Account';
import { Box } from '@mui/material';

import { useSession } from '../SessionContext';
import LanguageSelector from '../components/LanguageSelector';

function CustomAccount() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <LanguageSelector />
      <Account
        slotProps={{
          preview: { slotProps: { avatarIconButton: { sx: { border: '0' } } } },
        }}
      />
    </Box>
  );
}

export default function Layout() {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ width: '100%' }}>
        <LinearProgress />
      </div>
    );
  }

  if (!session) {
    // Add the `callbackUrl` search parameter
    const redirectTo = `/sign-in?callbackUrl=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <DashboardLayout slots={{ toolbarAccount: CustomAccount }}>
      <PageContainer sx={{ width: '100%' }}>
        <Outlet />
      </PageContainer>
    </DashboardLayout>
  );
}
