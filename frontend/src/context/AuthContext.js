import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem("ghostboard_token");
            if (!token) { setLoading(false); return; }
            try {
                const { data } = await axios.get(`${API}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(data);
            } catch {
                localStorage.removeItem("ghostboard_token");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const login = async (email, password) => {
        const { data } = await axios.post(`${API}/auth/login`, { email, password });
        localStorage.setItem("ghostboard_token", data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (email, name, password) => {
        const { data } = await axios.post(`${API}/auth/register`, { email, name, password });
        localStorage.setItem("ghostboard_token", data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem("ghostboard_token");
        setUser(null);
    };

    const getToken = () => localStorage.getItem("ghostboard_token");

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, getToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
