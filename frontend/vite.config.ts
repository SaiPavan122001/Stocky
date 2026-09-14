import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Relative asset paths are required for Capacitor's native WebView, which
  // serves the built app from file:// rather than an http(s) origin.
  base: "./",
  server: {
    host: "::",
    // 8080 (the old default here) collides with backend-go, which also
    // listens on 8080 -- moved to Vite's own conventional default instead.
    port: 5173,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
