import React, { useState, useEffect } from 'react';
import { getExpiringChecks } from '../firebase/firestore';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import { getAuth } from 'firebase/auth';
import { Gauge } from '@mui/x-charts/Gauge';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface ExpiringChecks {
    expiringInHour: QueryDocumentSnapshot<DocumentData>[];
    expiringInDay: QueryDocumentSnapshot<DocumentData>[];
    expiringInWeek: QueryDocumentSnapshot<DocumentData>[];
    totalShared: number;
}

export default function StatisticsPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checks, setChecks] = useState<ExpiringChecks | null>(null);
    const auth = getAuth();

    useEffect(() => {
        const fetchStats = async () => {
            if (!auth.currentUser) {
                setError("You must be signed in to view statistics.");
                setLoading(false);
                return;
            }

            try {
                const expiringChecks = await getExpiringChecks();
                setChecks(expiringChecks);
            } catch (err: any) {
                console.error("Error fetching statistics:", err);
                setError("Failed to load statistics: " + (err.message || "Unknown error"));
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [auth]);

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
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!checks) {
        return null;
    }    const maxValue = checks.totalShared;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                {t('statistics.title')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <Paper 
                        sx={{ 
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AccessTimeIcon sx={{ mr: 1, color: 'warning.main' }} />
                            <Typography variant="h6" align="center">
                                {t('statistics.expiringInHour')}
                            </Typography>
                        </Box>
                        <Box sx={{ position: 'relative', height: 200, width: '100%' }}>
                            <Gauge
                                sx={{ width: '100%' }}
                                value={checks.expiringInHour.length/maxValue*100}
                                min={0}
                                max={maxValue}
                                text={`${checks.expiringInHour.length} / ${maxValue}`}
                            />

                        </Box>
                        {checks.expiringInHour.length > 0 && (
                            <List sx={{ width: '100%', mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ pl: 2 }}>
                                    {t('statistics.expiringChecks')}
                                </Typography>
                                {checks.expiringInHour.map((doc) => (
                                    <React.Fragment key={doc.id}>
                                        <ListItem>
                                            <ListItemText 
                                                primary={doc.data().original_string} 
                                                secondary={new Date(doc.data().expire.toDate()).toLocaleTimeString()}
                                            />
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Box>

                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <Paper 
                        sx={{ 
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <CalendarTodayIcon sx={{ mr: 1, color: 'info.main' }} />
                            <Typography variant="h6" align="center">
                                {t('statistics.expiringInDay')}
                            </Typography>
                        </Box>
                        <Box sx={{ position: 'relative', height: 200, width: '100%' }}>
                            <Gauge
                                sx={{ width: '100%' }}
                                value={checks.expiringInDay.length/maxValue*100}
                                min={0}
                                max={maxValue}
                                text={`${checks.expiringInDay.length} / ${maxValue}`}
                            />
                        </Box>
                        {checks.expiringInDay.length > 0 && (
                            <List sx={{ width: '100%', mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ pl: 2 }}>
                                    {t('statistics.expiringChecks')}
                                </Typography>
                                {checks.expiringInDay.map((doc) => (
                                    <React.Fragment key={doc.id}>
                                        <ListItem>
                                            <ListItemText 
                                                primary={doc.data().original_string} 
                                                secondary={new Date(doc.data().expire.toDate()).toLocaleString()}
                                            />
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Box>

                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <Paper 
                        sx={{ 
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <DateRangeIcon sx={{ mr: 1, color: 'success.main' }} />
                            <Typography variant="h6" align="center">
                                {t('statistics.expiringInWeek')}
                            </Typography>
                        </Box>
                        <Box sx={{ position: 'relative', height: 200, width: '100%' }}>
                            <Gauge
                                sx={{ width: '100%' }}
                                value={checks.expiringInWeek.length/maxValue*100}
                                min={0}
                                max={maxValue}
                                text={`${checks.expiringInWeek.length} / ${maxValue}`} />
                        </Box>
                        {checks.expiringInWeek.length > 0 && (
                            <List sx={{ width: '100%', mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ pl: 2 }}>
                                    {t('statistics.expiringChecks')}
                                </Typography>
                                {checks.expiringInWeek.map((doc) => (
                                    <React.Fragment key={doc.id}>
                                        <ListItem>
                                            <ListItemText 
                                                primary={doc.data().original_string} 
                                                secondary={new Date(doc.data().expire.toDate()).toLocaleDateString()}
                                            />
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
}
