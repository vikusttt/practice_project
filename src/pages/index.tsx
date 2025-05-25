import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Button, 
    TextareaAutosize, 
    Select, 
    MenuItem, 
    Stack, 
    Paper, 
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    TextField,
    Snackbar,
    Typography,
    Alert,
    Box
} from "@mui/material";
import { ShareLocationRounded, ShareOutlined, ShareRounded, SpellcheckRounded } from "@mui/icons-material";
import NSpell from "nspell";
import { styled } from '@mui/material/styles';

// Import Hunspell files as raw text
import enAff from '../assets/en_US.aff?raw';
import enDic from '../assets/en_US.dic?raw';
import ukAff from '../assets/uk_UA.aff?raw';
import ukDic from '../assets/uk_UA.dic?raw';

// Add Firestore helper import
import { addDoc, Timestamp, doc, updateDoc } from "firebase/firestore";
import { checksCollection } from '../firebase/firestore';
import { getAuth } from "firebase/auth";

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: (theme.vars ?? theme).palette.text.secondary,
    ...theme.applyStyles('dark', {
        backgroundColor: '#1A2027',
    }),
}));

export default function DashboardPage() {
    const { t, i18n } = useTranslation();
    const [inputText, setInputText] = React.useState('');
    const [outputText, setOutputText] = React.useState('');
    const [lang, setLang] = React.useState<'en' | 'uk'>('en');
    const [spell, setSpell] = React.useState<NSpell | null>(null);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
    const [selectedExpiration, setSelectedExpiration] = React.useState<string>('1h');
    const [lastCheckId, setLastCheckId] = React.useState<string | null>(null);
    const [sharedLink, setSharedLink] = React.useState<string>('');
    const [copySuccess, setCopySuccess] = React.useState(false);

    // Sync spell checker language with i18n language
    React.useEffect(() => {
        const handleLanguageChange = (newLang: string) => {
            if (newLang === 'en' || newLang === 'uk') {
                setLang(newLang);
            }
        };

        // Set initial language
        handleLanguageChange(i18n.language);

        // Listen for language changes
        i18n.on('languageChanged', handleLanguageChange);

        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [i18n]);

    // Load dictionary on page load and when language changes
    React.useEffect(() => {
        setLoading(true);
        setSpell(null);
        setTimeout(() => {
            let nspell: NSpell;
            if (lang === 'en') {
                nspell = new NSpell(enAff, enDic);
            } else {
                nspell = new NSpell(ukAff, ukDic);
            }
            setSpell(nspell);
            setLoading(false);
        }, 0);
    }, [lang]);

    // Updated handleCheck: made async and saving results to Firestore.
    const handleCheck = React.useCallback(async () => {
        if (!spell) return;
        
        // Split text into segments while preserving single spaces
        const segments = inputText.split(/(\s)/);
        
        const checked = segments.map(segment => {
            // Return spaces as-is to maintain original spacing
            if (segment === ' ') {
                return segment;
            }
            
            // Match word characters (including Cyrillic), apostrophes and punctuation separately
            const parts = segment.match(/[\wʼ'`'А-ЯҐЄІЇа-яґєії]+|[.,!?;:"\-\(\)…—]+|[']/g) || [segment];
            
            return parts.map(part => {
                // Skip checking punctuation and single quotes
                if (part.match(/^[.,!?;:"\-\(\)…—]+$/) || part === "'") {
                    return part;
                }
                
                // Remove surrounding punctuation for spell check
                const word = part.replace(/^[']+|[']+$/g, '');
                if (!word || !spell.correct(word)) {
                    const suggestions = spell.suggest(word);
                    return suggestions.length > 0
                        ? `[${part}→${suggestions.join('|')}]`
                        : `[${part}→?]`;
                }
                return part;
            }).join('');
        });
        const correctedText = checked.join('');
        setOutputText(correctedText);
        const without_errors = inputText.replace(/\s/g, '') === correctedText.replace(/\s/g, '');
        try {
            const auth = getAuth();
            const docRef = await addDoc(checksCollection, {
                original_string: inputText,
                corrected_string: without_errors ? [] : checked,
                without_errors,
                language: lang,
                created_at: new Timestamp(Math.floor(Date.now() / 1000), 0),
                user_email: auth.currentUser?.email || 'unknown',
                user_uid: auth.currentUser?.uid || 'unknown',
                user_name: auth.currentUser?.displayName || 'Anonymous'
            });
            setLastCheckId(docRef.id); // Save the document ID for sharing
        } catch (error) {
            console.error("Error saving check results:", error);
        }
    }, [inputText, spell, lang]);

    const handleShareClick = () => {
        setShareDialogOpen(true);
    };

    const handleCloseShare = () => {
        setShareDialogOpen(false);
        setSharedLink(''); // Reset shared link when closing dialog
    };

    const getExpirationDate = (option: string): Date => {
        const now = new Date();
        switch (option) {
            case '1h':
                return new Date(now.setHours(now.getHours() + 1));
            case '3d':
                return new Date(now.setDate(now.getDate() + 3));
            case '7d':
                return new Date(now.setDate(now.getDate() + 7));
            case '1m':
                return new Date(now.setMonth(now.getMonth() + 1));
            case '3m':
                return new Date(now.setMonth(now.getMonth() + 3));
            default:
                return new Date(now.setDate(now.getDate() + 3));
        }
    };

    const handleShare = async () => {
        if (!lastCheckId) return;
        
        try {
            const expireDate = getExpirationDate(selectedExpiration);
            const docRef = doc(checksCollection, lastCheckId);
            await updateDoc(docRef, {
                expire: Timestamp.fromDate(expireDate),
                shared: true
            });
            
            // Generate the shared link using window.location.origin
            const baseUrl = window.location.origin;
            const link = `${baseUrl}/view_check?id=${lastCheckId}`;
            setSharedLink(link);
        } catch (error) {
            console.error("Error updating expiration date:", error);
        }
    };

    if (loading) {
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh' }}>
                <CircularProgress />
            </Stack>
        );
    }

    return (
        <Stack direction={"column"} maxWidth={1} spacing={2} alignItems={"center"}>
            <Stack direction={"row"} sx={{ width: 1 }} spacing={2} alignItems={"center"}>
                <Item>
                    <TextareaAutosize
                        aria-label="input"
                        placeholder={t('spell_checker.input_placeholder')}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        style={{ height: 200, width: 600 }}
                        minRows={3}
                    />
                </Item>
                <Item>
                    <TextareaAutosize
                        aria-label="output"
                        placeholder={t('spell_checker.output_placeholder')}
                        value={outputText}
                        readOnly
                        style={{ height: 200, width: 600 }}
                        minRows={3}
                    />
                </Item>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
                <Select
                    value={lang}
                    onChange={e => {
                        const newLang = e.target.value as 'en' | 'uk';
                        setLang(newLang);
                        // Removed i18n.changeLanguage(newLang) to ensure only spell checker language changes
                    }}
                    size="small"
                >
                    <MenuItem value="en">{t('spell_checker.languages.english')}</MenuItem>
                    <MenuItem value="uk">{t('spell_checker.languages.ukrainian')}</MenuItem>
                </Select>
                <Button
                    variant="contained"
                    onClick={handleCheck}
                    disabled={!inputText.trim() || !spell}
                    startIcon={<SpellcheckRounded />}
                >
                    {t('spell_checker.check_button')}
                </Button>
                <Button
                    variant='contained'
                    disabled={!outputText.trim()}
                    onClick={handleShareClick}
                    startIcon={<ShareRounded />}
                    title={!outputText.trim() ? t('spell_checker.share_tooltip') : undefined}
                >
                    {t('spell_checker.share_button')}
                </Button>
            </Stack>

            <Dialog 
                open={shareDialogOpen} 
                onClose={handleCloseShare}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ pb: 1 }}>{t('share_dialog.title')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('share_dialog.description')}
                        </Typography>
                        <FormControl fullWidth>
                            <Typography variant="subtitle2" gutterBottom>
                                {t('share_dialog.link_expiration')}
                            </Typography>
                            <Select
                                size="small"
                                value={selectedExpiration}
                                onChange={(e) => setSelectedExpiration(e.target.value)}
                            >
                                <MenuItem value="1h">{t('share_dialog.expiration_options.1h', { time: new Date(new Date().setHours(new Date().getHours() + 1)).toLocaleTimeString() })}</MenuItem>
                                <MenuItem value="3d">{t('share_dialog.expiration_options.3d', { date: new Date(new Date().setDate(new Date().getDate() + 3)).toLocaleDateString() })}</MenuItem>
                                <MenuItem value="7d">{t('share_dialog.expiration_options.7d', { date: new Date(new Date().setDate(new Date().getDate() + 7)).toLocaleDateString() })}</MenuItem>
                                <MenuItem value="1m">{t('share_dialog.expiration_options.1m', { date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString() })}</MenuItem>
                                <MenuItem value="3m">{t('share_dialog.expiration_options.3m', { date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString() })}</MenuItem>
                            </Select>
                        </FormControl>
                        {sharedLink && (
                            <>
                                <Box>                                <Typography variant="subtitle2" gutterBottom>
                                    {t('share_dialog.shareable_link')}
                                </Typography>
                                <TextField
                                    fullWidth
                                    value={sharedLink}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <Button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(sharedLink);
                                                    setCopySuccess(true);
                                                }}
                                                size="small"
                                                variant="contained"
                                                sx={{ ml: 1 }}
                                            >
                                                {t('share_dialog.copy_link')}
                                            </Button>
                                        ),
                                    }}
                                />
                            </Box>
                            <Alert severity="success" sx={{ mt: 2 }}>
                                {t('share_dialog.link_generated')}
                            </Alert>
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleCloseShare} color="inherit">
                        {t('share_dialog.close')}
                    </Button>
                    {!sharedLink && (
                        <Button 
                            onClick={handleShare} 
                            variant="contained"
                            startIcon={<ShareOutlined />}
                        >
                            {t('share_dialog.generate_link')}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
            <Snackbar
                open={copySuccess}
                autoHideDuration={2000}
                onClose={() => setCopySuccess(false)}
                message={t('share_dialog.link_copied')}
            />
        </Stack>
    );
}
