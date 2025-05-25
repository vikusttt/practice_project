import React, { useState, useEffect, useCallback } from 'react';
import { getAllChecks, SpellCheck } from '../firebase';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Menu,
  MenuItem
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import GoogleIcon from '@mui/icons-material/Google';
import { signInWithGoogle } from '../firebase';
import { 
  DataGrid,
  GridRenderCellParams,
  GridRowParams,
  GridCallbackDetails,
  MuiEvent,
  GridEventListener
} from '@mui/x-data-grid';
import { GridColDef } from '@mui/x-data-grid';
import { Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { checksCollection } from '../firebase/firestore';
import { useTranslation } from 'react-i18next';


const ChecksPage: React.FC = () => {
  const { t } = useTranslation();
  const [checks, setChecks] = useState<SpellCheck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    id: string;
  } | null>(null);
  const auth = getAuth();

  const fetchChecks = useCallback(async () => {
    if (!auth.currentUser) {
      setError("You must be signed in to view checks.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const checksData = await getAllChecks();
      setChecks(checksData);
    } catch (err: any) {
      console.error("Error fetching checks:", err);
      if (err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions')) {
        setError("You don't have permission to access these records. Please ensure you are signed in with an account that has appropriate access.");
      } else {
        setError("Failed to load checks: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchChecks();
      } else {
        setChecks([]);
        setLoading(false);
        setError(null);
      }
    });
    return () => unsubscribe();
  }, [auth, fetchChecks]);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (signInError: any) {
      console.error("Error signing in:", signInError);
      setError("Failed to sign in. Please try again. " + (signInError.message || ""));
    }
  };

  const handleRetry = () => {
    if (currentUser) {
      fetchChecks();
    } else {
      setError("Please sign in to retry.");
    }
  };
  const handleRowClick = (event: React.MouseEvent<HTMLElement>) => {
    const id = (event.currentTarget as HTMLElement).getAttribute('data-id');
    if (id) {
              window.open(`/view_check?id=${id}`, '_blank');
    }  
  };
  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const id = (event.currentTarget as HTMLElement).getAttribute('data-id');
    if (id) {
      setContextMenu({
        mouseX: event.clientX,
        mouseY: event.clientY,
        id
      });
    }
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deleteDoc(doc(checksCollection, id));
      await fetchChecks(); // Refresh the list
      setContextMenu(null);
    } catch (err: any) {
      console.error("Error deleting check:", err);
      setError("Failed to delete check: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (loading && currentUser === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Container maxWidth={false} disableGutters>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Access Restricted
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You need to be signed in to view checks.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleSignIn}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              RETRY
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // DataGrid columns definition
  const columns: GridColDef[] = [
    {
      field: 'original_string',
      headerName: t('spellChecks.originalText'),
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'status',
      headerName: t('spellChecks.status'),
      width: 90,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center">
          {params.row.without_errors ? (
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
          ) : (
            <ErrorIcon color="error" sx={{ mr: 1 }} />
          )}
          {params.row.without_errors ? t('spellChecks.ok') : t('spellChecks.errors')}
        </Box>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: 'language',
      headerName: t('spellChecks.language'),
      width: 120,
    },
    {
      field: 'corrections',
      headerName: t('spellChecks.suggestedCorrections'),
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => {
        const corrections = Array.isArray(params.row.corrected_string)
          ? params.row.corrected_string
          : params.row.corrected_string
            ? [params.row.corrected_string]
            : [];
        return corrections.length > 0
          ? corrections.join(', ')
          : t('spellChecks.noCorrectionsNeeded');
      },
      sortable: false,
      filterable: false,
    },
    {
      field: 'created_at',
      headerName: t('spellChecks.created'),
      width: 180,
      type: 'dateTime',
      valueGetter: (value) => {
        if (!value) {
          return value;
        }
        return (value as Timestamp).toDate();
      },
      sortable: true,
    },
    {
      field: 'expire',
      headerName: t('spellChecks.expiresAt'),
      width: 180,
      type: 'dateTime',
      valueGetter: (value) => {
        if (!value) {
          return value;
        }
        return (value as Timestamp).toDate();
      },
      sortable: true,
    },
    {
      field: 'user',
      headerName: t('spellChecks.author'),
      type: 'string',
      width: 300,
      sortable: true,
      filterable: true,
      valueGetter: (value, row) => `${row.user_name || t('spellChecks.anonymous')} (${row.user_email})`,
    }
  ];

  // DataGrid rows
  const rows = checks.map((check) => ({
    id: check.id,
    original_string: check.original_string,
    without_errors: check.without_errors,
    language: check.language,
    corrected_string: check.corrected_string,
    expire: check.expire,
    created_at: check.created_at,
    user_email: check.user_email,
    user_uid: check.user_uid,
    user_name: check.user_name
  }));


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        {t('spellChecks.title')}
      </Typography>

      {checks.length === 0 ? (
        <Typography variant="body1">{t('spellChecks.noChecksFound')}</Typography>
      ) : (
        <Paper sx={{ width: '100%', height: 520 }}>
          {/* DataGrid Component */}
          <DataGrid
            rows={rows}
            columns={columns}
            slotProps={{
              row: {
                onContextMenu: handleContextMenu,
                onClick: handleRowClick,
                style: { cursor: 'context-menu' },
              }}}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            getRowClassName={(params) =>
              params.row.without_errors ? 'success-row' : 'error-row'
            }
            sx={{
              '& .success-row': {
                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                cursor: 'context-menu',
              },
              '& .error-row': {
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
                cursor: 'context-menu',
              },
            }}
          />

          {/* Context Menu */}
          <Menu
            open={contextMenu !== null}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
          >
            <MenuItem
              onClick={() => {
                if (contextMenu) handleDelete(contextMenu.id);
              }}
              sx={{ color: 'error.main' }}
            >
              {t('spellChecks.delete')}
            </MenuItem>
            <MenuItem onClick={handleClose}>{t('spellChecks.cancel')}</MenuItem>
          </Menu>
        </Paper>
      )}
    </Container>
  );
};

export default ChecksPage;

