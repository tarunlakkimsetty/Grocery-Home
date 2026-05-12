const LOCAL_API_FALLBACK = 'http://localhost:5000/api';
const PRODUCTION_API_FALLBACK = 'https://grocery-home.onrender.com/api';

const normalizeApiBaseUrl = (rawBaseUrl) => {
    const trimmed = String(rawBaseUrl || '').trim().replace(/\/+$/, '');

    if (!trimmed) {
        if (typeof window !== 'undefined') {
            const host = String(window.location.hostname || '').toLowerCase();
            if (host === 'localhost' || host === '127.0.0.1') {
                return LOCAL_API_FALLBACK;
            }
        }

        return PRODUCTION_API_FALLBACK;
    }

    if (/\/api$/i.test(trimmed)) {
        return trimmed;
    }

    return `${trimmed}/api`;
};

const getBackendOrigin = () => normalizeApiBaseUrl(process.env.REACT_APP_API_URL).replace(/\/api\/?$/i, '');

const resolveBackendUrl = (value) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('//')) return `https:${value}`;
    if (value.startsWith('blob:') || value.startsWith('data:')) return value;

    const origin = getBackendOrigin();
    return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
};

export { normalizeApiBaseUrl, getBackendOrigin, resolveBackendUrl };