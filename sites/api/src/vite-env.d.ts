/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_HUB_ADMIN_BASE_URL: string;
  readonly VITE_API_HUB_OPENAI_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
