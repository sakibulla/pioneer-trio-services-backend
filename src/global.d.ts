/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
      DATABASE_URL?: string;
      REDIS_URL?: string;
      JWT_SECRET?: string;
      ENCRYPTION_MASTER_KEY?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      STORAGE_PROVIDER?: string;
      PORT?: string;
      [key: string]: string | undefined;
    }
  }
}

export {};
