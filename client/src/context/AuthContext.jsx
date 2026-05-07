import { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

const SECRET_CRYPTO = '123456';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const decryptUser = (encryptedData) => {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_CRYPTO);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            return JSON.parse(decryptedString);
        } catch {
            return null;
        }
    };

    const fetchUser = async () => {
        try {
            const logged = Cookies.get('logged');
            if (!logged) {
                setUser(null);
                setLoading(false);
                return;
            }
            const res = await axiosClient.get('/users/auth');
            const userData = decryptUser(res.metadata);
            setUser(userData);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (email, password) => {
        const res = await axiosClient.post('/users/login', { email, password });
        await fetchUser();
        return res;
    };

    const register = async (fullName, email, password) => {
        const res = await axiosClient.post('/users/register', { fullName, email, password });
        await fetchUser();
        return res;
    };

    const logout = async () => {
        await axiosClient.post('/users/logout');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        fetchUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
