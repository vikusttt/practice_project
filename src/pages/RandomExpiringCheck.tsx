import React, { useState, useEffect } from 'react';
import { getExpiringChecks } from '../firebase/firestore';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Paper,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import { HourglassBottom } from '@mui/icons-material';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

type TimeRange = 'hour' | 'day' | 'week';

export default function RandomExpiringCheckPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('hour');
    const [randomCheck, setRandomCheck] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

    useEffect(() => {
        const fetchRandomExpiringCheck = async () => {
            try {
                const expiringChecks = await getExpiringChecks();
                let checksArray: QueryDocumentSnapshot<DocumentData>[] = [];
                
                switch(timeRange) {
                    case 'hour':
                        checksArray = expiringChecks.expiringInHour;
                        break;
                    case 'day':
                        checksArray = expiringChecks.expiringInDay;
                        break;
                    case 'week':
                        checksArray = expiringChecks.expiringInWeek;
                        break;
                }

                if (checksArray.length > 0) {
                    const randomIndex = Math.floor(Math.random() * checksArray.length);
                    setRandomCheck(checksArray[randomIndex]);
                } else {
                    setRandomCheck(null);
                }
            } catch (err: any) {
                console.error("Error fetching random expiring check:", err);
                setError("Failed to load random expiring check: " + (err.message || "Unknown error"));
            } finally {
                setLoading(false);
            }
        };

        fetchRandomExpiringCheck();
    }, [timeRange]);

    const handleTimeRangeChange = (
        event: React.MouseEvent<HTMLElement>,
        newTimeRange: TimeRange,
    ) => {
        if (newTimeRange !== null) {
            setTimeRange(newTimeRange);
        }
    };

    const timeRangeLabels = {
        hour: t('randomExpiringCheck.oneHour'),
        day: t('randomExpiringCheck.twentyFourHours'),
        week: t('randomExpiringCheck.sevenDays')
    };

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

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <HourglassBottom sx={{ mr: 1 }} />
                <Typography variant="h4" component="h1">
                    {t('randomExpiringCheck.title')}
                </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    {t('randomExpiringCheck.timeRange')}:
                </Typography>
                <ToggleButtonGroup
                    value={timeRange}
                    exclusive
                    onChange={handleTimeRangeChange}
                    aria-label={t('randomExpiringCheck.timeRange')}
                >
                    {Object.entries(timeRangeLabels).map(([key, label]) => (
                        <ToggleButton key={key} value={key} aria-label={label}>
                            {label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            {!randomCheck ? (
                <Alert severity="info">
                    {t('randomExpiringCheck.noChecksFound')}
                </Alert>
            ) : (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('randomExpiringCheck.originalText')}:
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {randomCheck.data().original_string}
                    </Typography>

                    {!randomCheck.data().without_errors && randomCheck.data().corrected_string && (
                        <>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                {t('randomExpiringCheck.correctedText')}:
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'error.main' }}>
                                {randomCheck.data().corrected_string.join(' ')}
                            </Typography>
                        </>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('randomExpiringCheck.details')}:
                        </Typography>
                        <Typography variant="body2">
                            {t('randomExpiringCheck.language')}: {randomCheck.data().language.toUpperCase()}
                        </Typography>
                        <Typography variant="body2">
                            {t('randomExpiringCheck.containsErrors')}: {randomCheck.data().without_errors ? t('randomExpiringCheck.no') : t('randomExpiringCheck.yes')}
                        </Typography>
                        {randomCheck.data().expire && (
                            <Typography variant="body2" color="warning.main">
                                {t('randomExpiringCheck.expires')}: {randomCheck.data().expire.toDate().toLocaleString()}
                            </Typography>
                        )}
                    </Box>
                </Paper>
            )}
        </Container>
    );
}
