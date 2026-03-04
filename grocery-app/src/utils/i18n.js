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
    const s = String(status || '').trim();
    const map = {
        'Pending Acceptance': 'pendingAcceptance',
        Accepted: 'accepted',
        Pending: 'pending',
        Verified: 'verified',
        Paid: 'paid',
        Delivered: 'delivered',
        Completed: 'completed',
        Rejected: 'rejected',
        Unpaid: 'unpaid',
    };
    return map[s] || s;
};
