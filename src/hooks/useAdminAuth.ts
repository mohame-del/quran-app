import { useState, useEffect } from 'react';

const ADMIN_CREDS_KEY = 'admin_credentials';
const ADMIN_SESSION_KEY = 'admin_session_token';

// Default Credentials (Fallback)
const DEFAULT_CREDS = {
    email: 'mohamedelghazali982@gmail.com',
    phone: '0770954758',
    password: 'Agonkarimaouzir'
};

export const useAdminAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check session
        const token = localStorage.getItem(ADMIN_SESSION_KEY);
        if (token === 'valid_admin_token') {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = (email: string, phone: string, pass: string) => {
        // Get stored credentials or use default
        const stored = localStorage.getItem(ADMIN_CREDS_KEY);
        const creds = stored ? JSON.parse(stored) : DEFAULT_CREDS;

        if (email === creds.email && phone === creds.phone && pass === creds.password) {
            localStorage.setItem(ADMIN_SESSION_KEY, 'valid_admin_token');
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        setIsAuthenticated(false);
    };

    const updateCredentials = (newCreds: typeof DEFAULT_CREDS) => {
        localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(newCreds));
    };

    const getCredentials = () => {
        const stored = localStorage.getItem(ADMIN_CREDS_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_CREDS;
    }

    return { isAuthenticated, login, logout, loading, updateCredentials, getCredentials };
};
