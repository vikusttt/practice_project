import React, { useState, useEffect } from 'react';
import { getAllChecks, SpellCheck } from '../firebase/firestore';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Paper
} from '@mui/material';
import { ShuffleRounded } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function RandomCheckPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [randomCheck, setRandomCheck] = useState<SpellCheck | null>(null);

    useEffect(() => {
        const fetchRandomCheck = async () => {
            try {
                const checks = await getAllChecks();
                if (checks.length > 0) {
                    const randomIndex = Math.floor(Math.random() * checks.length);
                    setRandomCheck(checks[randomIndex]);
                }
            } catch (err: any) {
                console.error("Error fetching random check:", err);
                setError("Failed to load random check: " + (err.message || "Unknown error"));
            } finally {
                setLoading(false);
            }
        };

        fetchRandomCheck();
    }, []);

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

    if (!randomCheck) {
        return (
            <Box m={2}>
                <Alert severity="info">{t('randomCheck.noChecksFound')}</Alert>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ShuffleRounded sx={{ mr: 1 }} />
                <Typography variant="h4" component="h1">
                    {t('randomCheck.title')}
                </Typography>
            </Box>
            <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('randomCheck.originalText')}:
                </Typography>
                <Typography variant="body1" paragraph>
                    {randomCheck.original_string}
                </Typography>

                {!randomCheck.without_errors && randomCheck.corrected_string && (
                    <>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {t('randomCheck.correctedText')}:
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'error.main' }}>
                            {randomCheck.corrected_string.join(' ')}
                        </Typography>
                    </>
                )}

                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {t('randomCheck.details')}:
                    </Typography>
                    <Typography variant="body2">
                        {t('randomCheck.language')}: {randomCheck.language.toUpperCase()}
                    </Typography>
                    <Typography variant="body2">
                        {t('randomCheck.containsErrors')}: {randomCheck.without_errors ? t('randomCheck.no') : t('randomCheck.yes')}
                    </Typography>
                    {randomCheck.created_at && (
                        <Typography variant="body2">
                            {t('randomCheck.created')}: {randomCheck.created_at.toDate().toLocaleString()}
                        </Typography>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}
