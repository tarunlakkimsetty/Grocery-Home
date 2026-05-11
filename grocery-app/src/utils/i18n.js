import { translations } from '../translations/translations';

export const getCurrentLanguage = () => {
    const lang = localStorage.getItem('appLanguage') || 'en';
    return lang === 'te' ? 'te' : 'en';
};

export const getLocale = () => {
    return getCurrentLanguage() === 'te' ? 'te-IN' : 'en-IN';
};

export const t = (key) => {
    const lang = getCurrentLanguage();
    const obj = translations?.[lang];
    const val = obj && obj[key];
    return val ? val : key;
};

export const hasTranslation = (key) => {
    const k = String(key || '').trim();
    if (!k) return false;
    return Boolean(translations?.en?.[k] || translations?.te?.[k]);
};

export const statusKey = (status) => {
    const s = String(status || '').trim().toLowerCase();
    const map = {
        'pending acceptance': 'pendingAcceptance',
        accepted: 'accepted',
        pending: 'pending',
        verified: 'verified',
        converted: 'processing',
        paid: 'paid',
        delivered: 'delivered',
        completed: 'completed',
        rejected: 'rejected',
        unpaid: 'unpaid',
    };
    return map[s] || status || '';
};
