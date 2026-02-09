// Global type declarations for Node.js environment
declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    NODE_ENV?: string;
    CORS_ORIGIN?: string;
    [key: string]: string | undefined;
  }

  interface Process {
    env: ProcessEnv;
  }
}

declare const process: NodeJS.Process;

// Buffer type
declare class Buffer {
  static from(data: string | ArrayBuffer | ArrayBufferView, encoding?: string): Buffer;
  static isBuffer(obj: any): obj is Buffer;
  toString(encoding?: string): string;
}
