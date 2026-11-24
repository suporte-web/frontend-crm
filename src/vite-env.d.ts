/// <reference types="vite/client" />
declare const __APP_VERSION__: { readonly version: string; readonly buildDate: string | null; readonly commit: string | null };

interface ImportMetaEnv {
  readonly VITE_API_BACKEND?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_PUBLIC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
