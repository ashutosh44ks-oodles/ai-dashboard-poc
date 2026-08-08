// env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      THESYS_API_KEY: string;
      THESYS_BASE_URL: string;
      OPENROUTER_API_KEY: string;
      OPENROUTER_BASE_URL: string;
      OPENROUTER_MODEL?: string;
      OPENROUTER_MODEL_ADVANCED?: string;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_HOST: string;
      DB_PORT: string;
      DB_NAME: string;
    }
  }
}
export {}; 