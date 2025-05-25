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
import { TextFields } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function LongestErrorFreeCheckPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [longestCheck, setLongestCheck] = useState<SpellCheck | null>(null);

    useEffect(() => {
        const fetchLongestErrorFreeCheck = async () => {
            try {
                const checks = await getAllChecks();
                const errorFreeChecks = checks.filter(check => check.without_errors);
                
                if (errorFreeChecks.length > 0) {
                    const longest = errorFreeChecks.reduce((prev, current) => {
                        return (prev.original_string.length > current.original_string.length) 
                            ? prev 
                            : current;
                    });
                    setLongestCheck(longest);
                }
            } catch (err: any) {
                console.error("Error fetching longest error-free check:", err);
                setError("Failed to load longest error-free check: " + (err.message || "Unknown error"));
            } finally {
                setLoading(false);
            }
        };

        fetchLongestErrorFreeCheck();
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

    if (!longestCheck) {
        return (
            <Box m={2}>
                <Alert severity="info">{t('longestErrorFreeCheck.noErrorFreeChecks')}</Alert>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TextFields sx={{ mr: 1 }} />
                <Typography variant="h4" component="h1">
                    {t('longestErrorFreeCheck.title')}
                </Typography>
            </Box>
            <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('longestErrorFreeCheck.text', { length: longestCheck.original_string.length })}
                </Typography>
                <Typography variant="body1" paragraph>
                    {longestCheck.original_string}
                </Typography>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {t('longestErrorFreeCheck.details')}:
                    </Typography>
                    <Typography variant="body2">
                        {t('longestErrorFreeCheck.language')}: {longestCheck.language.toUpperCase()}
                    </Typography>
                    {longestCheck.created_at && (
                        <Typography variant="body2">
                            {t('longestErrorFreeCheck.created')}: {longestCheck.created_at.toDate().toLocaleString()}
                        </Typography>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}
