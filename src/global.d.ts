declare global {
  var process: NodeJS.Process;
  var global: typeof globalThis;
  var Buffer: NodeJS.BufferConstructor;

  function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): any;
  function clearTimeout(timeoutId?: any): void;
  function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): any;
  function clearInterval(intervalId?: any): void;

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

    interface Process extends EventEmitter {
      env: ProcessEnv;
      exit(code?: number): never;
      cwd(): string;
      platform: string;
      version: string;
      versions: { [key: string]: string };
      nextTick(callback: (() => void) | (() => Promise<void>), ...args: any[]): void;
      uptime(): number;
      memoryUsage(): MemoryUsage;
      hrtime(time?: [number, number]): [number, number];
      on(event: string, listener: (...args: any[]) => void): any;
      once(event: string, listener: (...args: any[]) => void): any;
      emit(event: string | symbol, ...args: any[]): boolean;
      removeListener(event: string, listener: (...args: any[]) => void): any;
    }

    interface MemoryUsage {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers?: number;
    }

    interface BufferConstructor {
      alloc(size: number, fill?: string | Buffer | number, encoding?: string): Buffer;
      allocUnsafe(size: number): Buffer;
      from(data: any): Buffer;
      isBuffer(obj: any): obj is Buffer;
      concat(list: readonly Buffer[], totalLength?: number): Buffer;
    }

    interface Buffer {
      toString(encoding?: string, start?: number, end?: number): string;
      toJSON(): { type: string; data: number[] };
      length: number;
      [index: number]: number;
    }

    interface EventEmitter {
      on(event: string, listener: (...args: any[]) => void): any;
      once(event: string, listener: (...args: any[]) => void): any;
      emit(event: string | symbol, ...args: any[]): boolean;
      removeListener(event: string, listener: (...args: any[]) => void): any;
      removeAllListeners(event?: string): any;
      listeners(event: string): Function[];
      listenerCount(event: string | symbol): number;
    }
  }
}

declare const Buffer: NodeJS.BufferConstructor & {
  prototype: NodeJS.Buffer;
  new(size: number): NodeJS.Buffer;
  alloc(size: number, fill?: string | NodeJS.Buffer | number, encoding?: string): NodeJS.Buffer;
  allocUnsafe(size: number): NodeJS.Buffer;
  from(data: any): NodeJS.Buffer;
  isBuffer(obj: any): obj is NodeJS.Buffer;
  concat(list: readonly NodeJS.Buffer[], totalLength?: number): NodeJS.Buffer;
};

declare module "http" {
  export interface IncomingMessage {
    body?: any;
  }
  export interface ServerResponse {
    json?(data: any): void;
  }
  export function createServer(requestListener?: (req: IncomingMessage, res: ServerResponse) => void): any;
}

declare module "fs" {
  export function readFile(path: string, encoding?: string, callback?: (err: any, data: string | NodeJS.Buffer) => void): void;
  export function writeFile(path: string, data: string | NodeJS.Buffer, callback?: (err: any) => void): void;
  export function existsSync(path: string): boolean;
}

declare module "path" {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(p: string): string;
  export function basename(p: string, ext?: string): string;
}

declare module "crypto" {
  export function randomBytes(size: number, callback?: (err: any, buf: NodeJS.Buffer) => void): NodeJS.Buffer | void;
  export function createCipher(algorithm: string, password: string | NodeJS.Buffer): any;
  export function createDecipher(algorithm: string, password: string | NodeJS.Buffer): any;
  export function createHash(algorithm: string): any;
  export function createHmac(algorithm: string, key: string | NodeJS.Buffer): any;
}

export {};
