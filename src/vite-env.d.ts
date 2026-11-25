/// <reference types="vite/client" />

declare const __APP_VERSION__: {
  readonly version: string;
  readonly buildDate: string | null;
  readonly commit: string | null;
};
