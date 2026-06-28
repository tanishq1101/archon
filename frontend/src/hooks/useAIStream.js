import { useState, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export function useAIStream() {
    const { getToken: getClerkToken } = useClerkAuth();
    const [output, setOutput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);

    const stream = useCallback(async (endpoint, payload) => {
        setIsStreaming(true);
        setOutput("");
        setError(null);


        let token = null;
        try {
            // Mint a fresh in-memory token per request; never persist to localStorage.
            token = await getClerkToken();
        } catch (e) {
            console.error("Failed to get fresh Clerk token for stream:", e);
        }
        if (!token) {
            setError("Your session has expired. Please sign in again.");
            setIsStreaming(false);
            return "";
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
    }, [getClerkToken]);

    const clear = useCallback(() => {
        setOutput("");
        setError(null);
    }, []);

    return { output, isStreaming, error, stream, clear };
}

