import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/clerk-react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { isLoaded: authLoaded, userId, signOut, getToken: getClerkToken } = useClerkAuth();
    const { isLoaded: userLoaded, user: clerkUser } = useClerkUser();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // Keep the Clerk token in memory only — never in localStorage, which is
    // readable by any injected script (XSS exfiltration risk) and survives reloads.
    // The axios interceptor below stays the source of truth: it mints a fresh
    // token on every request regardless of this cached value.
    const tokenRef = useRef(null);

    // Sync Clerk user with AuthContext user state
    useEffect(() => {
        if (authLoaded && userLoaded) {
            if (clerkUser) {
                setUser({
                    id: clerkUser.id,
                    email: clerkUser.primaryEmailAddress?.emailAddress || "",
                    name: clerkUser.fullName || clerkUser.username || "User",
                    role: "user"
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        }
    }, [authLoaded, userLoaded, clerkUser]);

    // Keep the in-memory token fresh so the synchronous getToken() used by
    // pages always returns a usable value. Clerk tokens last ~60s.
    useEffect(() => {
        let cancelled = false;
        const refreshToken = async () => {
            if (!userId) {
                tokenRef.current = null;
                return;
            }
            try {
                const token = await getClerkToken();
                if (!cancelled) tokenRef.current = token || null;
            } catch (e) {
                console.error("Failed to refresh Clerk token:", e);
            }
        };

        refreshToken();
        const interval = setInterval(refreshToken, 45 * 1000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [userId, getClerkToken]);

    // Register Axios request interceptor to dynamically inject the token on every request
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(async (config) => {
            if (userId) {
                try {
                    const token = await getClerkToken();
                    if (token) {
                        tokenRef.current = token;
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                } catch (e) {
                    console.error("Failed to set Clerk token in Axios interceptor:", e);
                }
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });

        return () => axios.interceptors.request.eject(interceptor);
    }, [userId, getClerkToken]);



    const logout = async () => {
        tokenRef.current = null;
        await signOut();
        setUser(null);
    };

    const getToken = useCallback(() => tokenRef.current, []);

    return (
        <AuthContext.Provider value={{ user, loading, logout, getToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
