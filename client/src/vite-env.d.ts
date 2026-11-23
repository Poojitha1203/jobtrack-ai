/// <reference types="vite/client" />

// Type the VITE_* environment variables so import.meta.env is autocompleted and checked.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
