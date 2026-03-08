import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Prevent Vite from pre-bundling pdfjs-dist — it ships its own ESM build
    exclude: ["pdfjs-dist"],
  },
  worker: {
    format: "es",
  },
});
