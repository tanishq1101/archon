import { useState, useCallback } from "react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function useAIStream() {
    const [output, setOutput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);

    const stream = useCallback(async (endpoint, payload) => {
        setIsStreaming(true);
        setOutput("");
        setError(null);

        const token = localStorage.getItem("ghostboard_token");
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
                    setError(err.detail || "API error");
                } catch {
                    setError("API error");
                }
                setIsStreaming(false);
                return;
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
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.error) {
                            setError(parsed.error?.message || "Stream error");
                            setIsStreaming(false);
                            return;
                        }
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) setOutput((prev) => prev + content);
                    } catch {}
                }
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setIsStreaming(false);
        }
    }, []);

    const clear = useCallback(() => {
        setOutput("");
        setError(null);
    }, []);

    return { output, isStreaming, error, stream, clear };
}
