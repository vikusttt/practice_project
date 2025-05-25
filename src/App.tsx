import * as React from 'react';
import SpellcheckIcon from '@mui/icons-material/SpellcheckTwoTone';
import ArchiveIcon from '@mui/icons-material/ArchiveSharp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { Outlet } from 'react-router';
import type { User } from 'firebase/auth';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import type { Navigation, Authentication } from '@toolpad/core/AppProvider';
import { firebaseSignOut, signInWithGoogle, onAuthStateChanged } from './firebase/auth';
import SessionContext, { type Session } from './SessionContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTranslation } from 'react-i18next';
import SocialCreditPopup from './components/SocialCreditPopup';

const BRANDING = {
  title: 'Spell check app',
};

const AUTHENTICATION: Authentication = {
  signIn: signInWithGoogle,
  signOut: firebaseSignOut,
};

export default function App() {
  const { t } = useTranslation();

  const NAVIGATION: Navigation = [
    {
      kind: 'header',
      title: t('navigation.main_items'),
    },
    {
      title: t('navigation.check_spelling'),
      icon: <SpellcheckIcon />,
    },
    {
      kind: 'header',
      title: t('navigation.explore'),
    },
    {
      segment: 'checks',
      title: t('navigation.all_checks_list'),
      icon: <ArchiveIcon />,
    },
    {
      segment: 'random',
      title: t('navigation.random_check'),
      icon: <ShuffleIcon />,
    },
    {
      segment: 'random-expiring',
      title: t('navigation.random_expiring_check'),
      icon: <HourglassBottomIcon />,
    },
    {
      segment: 'longest-error-free',
      title: t('navigation.longest_error_free'),
      icon: <TextFieldsIcon />,
    },
    {
      kind: 'header',
      title: t('navigation.statistics'),
    },
    {
      segment: 'statistics',
      title: t('navigation.statistics'),
      icon: <AssessmentIcon />,
    },
  ];

  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  const sessionContextValue = React.useMemo(
    () => ({
      session,
      setSession,
      loading,
    }),
    [session, loading],
  );

  React.useEffect(() => {
    // Returns an `unsubscribe` function to be called during teardown
    const unsubscribe = onAuthStateChanged((user: User | null) => {
      if (user) {
        setSession({
          user: {
            name: user.displayName || '',
            email: user.email || '',
            image: user.photoURL || '',
          },
        });
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ReactRouterAppProvider
        navigation={NAVIGATION}
        branding={BRANDING}
        session={session}
        authentication={AUTHENTICATION}
      >
        <SessionContext.Provider value={sessionContextValue}>
          <SocialCreditPopup />
          <Outlet />
        </SessionContext.Provider>
      </ReactRouterAppProvider>
    </LocalizationProvider>
  );
}
