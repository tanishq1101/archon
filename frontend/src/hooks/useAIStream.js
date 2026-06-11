import { useState, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export function useAIStream(storageKey = null) {
    const { getToken: getClerkToken } = useClerkAuth();
    const [output, setOutput] = useState(() => {
        if (storageKey) {
            return localStorage.getItem(storageKey) || "";
        }
        return "";
    });
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);

    const stream = useCallback(async (endpoint, payload) => {
        setIsStreaming(true);
        setOutput("");
        setError(null);
        if (storageKey) {
            localStorage.removeItem(storageKey);
        }

        let token = null;
        try {
            token = await getClerkToken();
            if (token) {
                localStorage.setItem("ghostboard_token", token);
            }
        } catch (e) {
            console.error("Failed to get fresh Clerk token for stream:", e);
        }
        if (!token) {
            token = localStorage.getItem("ghostboard_token");
        }
        let accumulated = "";
        try {
            const response = await fetch(`${API}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                try {
                    const err = await response.json();
                    setError(err.message || err.detail || "API error");
                } catch {
                    setError("API error");
                }
                setIsStreaming(false);
                return "";
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data: ")) continue;
                    const data = trimmed.slice(6);
                    if (data === "[DONE]") {
                        setIsStreaming(false);
                        return accumulated;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.error) {
                            setError(parsed.error?.message || "Stream error");
                            setIsStreaming(false);
                            return accumulated;
                        }
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            accumulated += content;
                            setOutput((prev) => {
                                const next = prev + content;
                                if (storageKey) {
                                    localStorage.setItem(storageKey, next);
                                }
                                return next;
                            });
                        }
                    } catch {}
                }
            }
            return accumulated;
        } catch (e) {
            setError(e.message);
            return accumulated;
        } finally {
            setIsStreaming(false);
        }
    }, [storageKey, getClerkToken]);

    const clear = useCallback(() => {
        setOutput("");
        setError(null);
        if (storageKey) {
            localStorage.removeItem(storageKey);
        }
    }, [storageKey]);

    return { output, isStreaming, error, stream, clear };
}

