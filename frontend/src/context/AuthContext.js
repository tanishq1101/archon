import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth as useClerkAuth, useUser as useClerkUser, useSignIn, useSignUp } from "@clerk/clerk-react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { isLoaded: authLoaded, userId, signOut, getToken: getClerkToken } = useClerkAuth();
    const { isLoaded: userLoaded, user: clerkUser } = useClerkUser();
    const { signIn, isLoaded: signInLoaded } = useSignIn();
    const { signUp, isLoaded: signUpLoaded } = useSignUp();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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

    // Keep token refreshed in localStorage for useAIStream and compatibility
    useEffect(() => {
        const refreshToken = async () => {
            if (userId) {
                try {
                    const token = await getClerkToken();
                    if (token) {
                        localStorage.setItem("ghostboard_token", token);
                    } else {
                        localStorage.removeItem("ghostboard_token");
                    }
                } catch (e) {
                    console.error("Failed to refresh Clerk token in localStorage:", e);
                }
            } else {
                localStorage.removeItem("ghostboard_token");
            }
        };

        refreshToken();
        const interval = setInterval(refreshToken, 45 * 1000); // Clerk tokens last 60s, refresh every 45s
        return () => clearInterval(interval);
    }, [userId, getClerkToken]);

    // Register Axios request interceptor to dynamically inject the token on every request
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(async (config) => {
            if (userId) {
                try {
                    const token = await getClerkToken();
                    if (token) {
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

    const login = async (email, password) => {
        if (!signInLoaded) throw new Error("Sign in is not loaded yet.");
        const result = await signIn.create({
            identifier: email,
            password: password,
        });
        if (result.status === "complete") {
            const token = await getClerkToken();
            if (token) localStorage.setItem("ghostboard_token", token);
            return {
                id: result.createdSessionId,
                email: email,
                name: email.split("@")[0]
            };
        } else {
            throw new Error(`Authentication incomplete: status is ${result.status}`);
        }
    };

    const register = async (email, name, password) => {
        if (!signUpLoaded) throw new Error("Sign up is not loaded yet.");
        const result = await signUp.create({
            emailAddress: email,
            password: password,
            firstName: name.split(" ")[0],
            lastName: name.split(" ").slice(1).join(" ") || "",
        });
        if (result.status === "complete") {
            const token = await getClerkToken();
            if (token) localStorage.setItem("ghostboard_token", token);
            return {
                id: result.createdUserId,
                email: email,
                name: name
            };
        } else if (result.status === "missing_requirements") {
            // If email verification is needed, trigger it
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            throw new Error("verification_required");
        }
        return result;
    };

    const logout = async () => {
        await signOut();
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
