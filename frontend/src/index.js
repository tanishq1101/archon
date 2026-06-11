import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { ThemeProvider } from "next-themes";
import "@/index.css";
import App from "@/App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const CLERK_PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
if (!CLERK_PUBLISHABLE_KEY) {
  console.warn("Clerk Publishable Key is not set yet.");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>,
);

