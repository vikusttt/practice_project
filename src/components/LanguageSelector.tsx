import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Menu, MenuItem } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';

export default function LanguageSelector() {
    const { t, i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        handleClose();
        
        // Force a re-render when Chinese is selected to ensure the popup appears
        if (lang === 'zh') {
            // Small delay to ensure the language change is processed first
            setTimeout(() => {
                const event = new Event('languageChanged');
                window.dispatchEvent(event);
            }, 100);
        }
    };

    return (
        <>
            <IconButton
                onClick={handleClick}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={open ? 'language-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
            >
                <TranslateIcon />
            </IconButton>            <Menu
                id="language-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'language-button',
                }}
            >
                <MenuItem onClick={() => changeLanguage('en')}>
                    {t('spell_checker.languages.english')}
                </MenuItem>
                <MenuItem onClick={() => changeLanguage('uk')}>
                    {t('spell_checker.languages.ukrainian')}
                </MenuItem>
                <MenuItem onClick={() => changeLanguage('zh')}>
                    {t('spell_checker.languages.chinese')}
                </MenuItem>
            </Menu>
        </>
    );
}
