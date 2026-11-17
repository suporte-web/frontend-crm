import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { createApiProxy } from './config/api-proxy.ts';
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: { host: '127.0.0.1', port: 3000, strictPort: true, proxy: createApiProxy({
    target: loadEnv(mode, process.cwd(), '').BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001',
    prefix: loadEnv(mode, process.cwd(), '').BACKEND_API_PREFIX || '',
  }) },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy: createApiProxy({
    target: loadEnv(mode, process.cwd(), '').BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001',
    prefix: loadEnv(mode, process.cwd(), '').BACKEND_API_PREFIX || '',
  }) },
}));
