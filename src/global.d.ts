declare global {
  var process: NodeJS.Process;
  function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
  function clearTimeout(timeoutId?: NodeJS.Timeout): void;
  function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timer;
  function clearInterval(intervalId?: NodeJS.Timer): void;
}

declare namespace NodeJS {
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
  }
}

export {};
