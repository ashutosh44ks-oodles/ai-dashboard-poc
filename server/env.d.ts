// env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENROUTER_API_KEY: string;
      OPENROUTER_BASE_URL: string;
      OPENROUTER_MODEL?: string;
      OPENROUTER_MODEL_ADVANCED?: string;
      OPENROUTER_MODEL_UI?: string;
      PUBLIC_URL?: string;
      OPENROUTER_TLS_INSECURE?: string;
      SETTINGS_ENCRYPTION_KEY?: string;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_HOST: string;
      DB_PORT: string;
      DB_NAME: string;
    }
  }
}
export {}; 