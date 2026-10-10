declare global {
  var process: NodeJS.Process;
  var global: typeof globalThis;

  function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
  function clearTimeout(timeoutId?: NodeJS.Timeout): void;
  function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timer;
  function clearInterval(intervalId?: NodeJS.Timer): void;

  interface BufferConstructor {
    alloc(size: number, fill?: string | Buffer | number, encoding?: BufferEncoding): Buffer;
    allocUnsafe(size: number): Buffer;
    allocUnsafeFast(size: number): Buffer;
    byteLength(string: string | NodeJS.ArrayBufferView | ArrayBuffer, encoding?: string): number;
    compare(buf1: Uint8Array, buf2: Uint8Array): number;
    concat(list: readonly Uint8Array[], totalLength?: number): Buffer;
    from(arrayBuffer: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>, byteOffset?: number, length?: number): Buffer;
    from(data: Uint8Array | readonly number[]): Buffer;
    from(data: WithImplicitCoercion<string>, encoding?: BufferEncoding): Buffer;
    from(data: readonly number[]): Buffer;
    isBuffer(obj: any): obj is Buffer;
    isEncoding(encoding: string): encoding is BufferEncoding;
  }

  const Buffer: BufferConstructor;

  namespace NodeJS {
    interface Process {
      env: ProcessEnv;
      exit(code?: number): never;
      cwd(): string;
      platform: string;
      version: string;
      versions: { [key: string]: string };
      nextTick(callback: (() => void) | (() => Promise<void>), ...args: any[]): void;
    }

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

    type Timer = any;
    type Timeout = any;
  }
}

declare module "http" {
  interface IncomingMessage {
    body?: any;
  }
}

declare module "fs" {
  function readFile(path: string, callback: (err: Error | null, data: Buffer) => void): void;
  function writeFile(path: string, data: string | Buffer, callback: (err: Error | null) => void): void;
}

declare module "path" {
  function join(...paths: string[]): string;
  function resolve(...paths: string[]): string;
  function dirname(p: string): string;
  function basename(p: string, ext?: string): string;
}

declare module "crypto" {
  interface HexBase64Latin1Encoding {
    update(data: NodeJS.ArrayBufferView | string, inputEncoding?: string): any;
    digest(encoding: string): string;
  }

  function createCipher(algorithm: string, password: string | Buffer | TypedArray | DataView): any;
  function createDecipher(algorithm: string, password: string | Buffer | TypedArray | DataView): any;
  function randomBytes(size: number): Buffer;
  function randomBytes(size: number, callback: (err: Error | null, buf: Buffer) => void): void;
}

export {};
