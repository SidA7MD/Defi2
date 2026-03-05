import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations, languages, defaultLanguage } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        const saved = localStorage.getItem('ihsan_lang');
        return saved && translations[saved] ? saved : defaultLanguage;
    });

    const currentTranslations = translations[lang];
    const currentLangConfig = languages.find((l) => l.code === lang);
    const dir = currentLangConfig?.dir || 'ltr';
    const isRTL = dir === 'rtl';

    // Apply dir and lang to HTML element
    useEffect(() => {
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', lang);

        // Add Arabic font when switching to Arabic
        if (lang === 'ar') {
            document.body.style.fontFamily = "'Noto Sans Arabic', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        } else {
            document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        }
    }, [dir, lang]);

    const setLanguage = useCallback((newLang) => {
        if (translations[newLang]) {
            setLang(newLang);
            localStorage.setItem('ihsan_lang', newLang);
        }
    }, []);

    const toggleLanguage = useCallback(() => {
        const newLang = lang === 'fr' ? 'ar' : 'fr';
        setLanguage(newLang);
    }, [lang, setLanguage]);

    // t() helper — supports nested keys like 'nav.home'
    const t = useCallback((key) => {
        const keys = key.split('.');
        let value = currentTranslations;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // fallback to key
            }
        }
        return value;
    }, [currentTranslations]);

    const value = {
        lang,
        dir,
        isRTL,
        t,
        setLanguage,
        toggleLanguage,
        languages,
    };

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export default LanguageContext;
