import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { checksCollection } from '../firebase/firestore';
import {
    Container,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Stack,
    AppBar,
    Toolbar,
    IconButton,
    Snackbar,
    Button
} from '@mui/material';
import { SpellCheck } from '../firebase';
import SpellcheckIcon from '@mui/icons-material/SpellcheckTwoTone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MetaTags from '../components/MetaTags';
import { useTranslation } from 'react-i18next';

export default function ViewCheck() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [check, setCheck] = useState<SpellCheck | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [remainingTime, setRemainingTime] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const checkId = searchParams.get('id');

    const handleCopyText = async () => {
        if (!check) return;
        
        const textToCopy = Array.isArray(check.corrected_string)
            ? check.corrected_string.join(' ')
            : check.corrected_string || '';
            
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopySuccess(true);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    useEffect(() => {
        const fetchCheck = async () => {
            if (!checkId) {
                setError('No check ID provided');
                setLoading(false);
                return;
            }

            try {
                const checkDoc = await getDoc(doc(checksCollection, checkId));
                if (!checkDoc.exists()) {
                    setError('Check not found');
                    setLoading(false);
                    return;
                }

                const data = checkDoc.data() as SpellCheck;
                
                // Check if the document has expired
                if (data.expire) {
                    const expireDate = data.expire.toDate();
                    if (expireDate < new Date()) {
                        setError('This shared check has expired');
                        setLoading(false);
                        return;
                    }

                    // Calculate remaining time
                    const remainingMs = expireDate.getTime() - new Date().getTime();
                    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    
                    if (days > 0) {
                        setRemainingTime(`${days} days ${hours} hours`);
                    } else if (hours > 0) {
                        setRemainingTime(`${hours} hours`);
                    } else {
                        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                        setRemainingTime(`${minutes} minutes`);
                    }
                }

                setCheck({ ...data, id: checkDoc.id } as SpellCheck);
            } catch (err) {
                console.error('Error fetching check:', err);
                setError('Error loading the check');
            } finally {
                setLoading(false);
            }
        };

        fetchCheck();
    }, [checkId]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }    if (error) {
        return (
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Paper sx={{ p: 4 }}>
                    <Stack spacing={3} alignItems="center">
                        <SpellcheckIcon color="error" sx={{ fontSize: 48 }} />
                        <Typography variant="h5" align="center">
                            {error === 'Check not found'
                                ? 'Spell Check Not Found'
                                : error === 'This shared check has expired'
                                    ? 'Shared Check Has Expired'
                                    : error === 'No check ID provided'
                                        ? 'Invalid Link'
                                        : 'Error Loading Check'}
                        </Typography>
                        <Typography variant="body1" align="center" color="text.secondary">
                            {error === 'Check not found'
                                ? 'The spell check you\'re looking for doesn\'t exist or has been deleted.'
                                : error === 'This shared check has expired'
                                    ? 'This shared spell check has expired and is no longer accessible.'
                                    : error === 'No check ID provided'
                                        ? 'The link you followed is invalid or incomplete.'
                                        : 'There was a problem loading the spell check. Please try again later.'}
                        </Typography>
                        <Button
                            variant="contained"
                            href="/"
                            startIcon={<SpellcheckIcon />}
                        >
                            Go to Spell Check
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        );
    }

    if (!check) {
        return null;
    }    return (
        <>
            <MetaTags
                title={`${t('viewCheck.metaTitle')} - ${check.language === 'en' ? t('viewCheck.english') : t('viewCheck.ukrainian')}`}
                description={`${t('viewCheck.metaDescription', { text: check.original_string.slice(0, 100) })}${check.original_string.length > 100 ? '...' : ''}`}
            />
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <SpellcheckIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div">
                        {t('viewCheck.title')}
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack spacing={4}>
                    <Paper sx={{ p: 3 }} elevation={2}>
                        <Stack spacing={4}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Typography variant="h6">
                                        {t('viewCheck.originalText')}
                                    </Typography>
                                    <Button
                                        size="small"
                                        startIcon={<ContentCopyIcon />}
                                        onClick={() => {
                                            navigator.clipboard.writeText(check.original_string);
                                            setCopySuccess(true);
                                        }}
                                    >
                                        {t('viewCheck.copy')}
                                    </Button>
                                </Box>
                                <Box sx={{ 
                                    backgroundColor: '#f5f5f5', 
                                    p: 2, 
                                    borderRadius: 1,
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    <Typography component="div" variant="body1">
                                        {check.original_string}
                                    </Typography>
                                </Box>
                            </Box>
                            {check.without_errors ? (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    {t('viewCheck.noErrors', { language: check.language === 'en' ? t('viewCheck.english') : t('viewCheck.ukrainian') })}
                                </Alert>
                            ) : (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                        <Typography variant="h6">
                                            {t('viewCheck.correctedText')}
                                        </Typography>
                                        <Button
                                            size="small"
                                            startIcon={<ContentCopyIcon />}
                                            onClick={handleCopyText}
                                        >
                                            {t('viewCheck.copy')}
                                        </Button>
                                    </Box>
                                    <Box sx={{ 
                                        backgroundColor: '#f5f5f5', 
                                        p: 2, 
                                        borderRadius: 1,
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        <Typography component="div" variant="body1">
                                            {Array.isArray(check?.corrected_string)
                                                ? check?.corrected_string.join(' ')
                                                : check?.corrected_string}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                pt: 2,
                                borderTop: 1,
                                borderColor: 'divider'
                            }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('viewCheck.language')}: {check?.language.toUpperCase()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('viewCheck.status')}: {check?.without_errors ? t('viewCheck.noErrorsFound') : t('viewCheck.correctionsSuggested')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('viewCheck.author')}: {check?.user_name || t('viewCheck.anonymous')} ({check?.user_email})
                                    </Typography>
                                </Box>
                                {remainingTime && (
                                    <Typography variant="body2" sx={{ 
                                        color: 'warning.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        ⏳ {t('viewCheck.expiresIn')}: {remainingTime}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    </Paper>
                </Stack>
            </Container>
            <Snackbar
                open={copySuccess}
                autoHideDuration={2000}
                onClose={() => setCopySuccess(false)}
                message={t('viewCheck.textCopied')}
            />
        </>
    );
}
