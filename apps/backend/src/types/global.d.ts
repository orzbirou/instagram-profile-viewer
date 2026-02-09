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
  length: number;
  static from(data: string | ArrayBuffer | ArrayBufferView, encoding?: string): Buffer;
  static isBuffer(obj: any): obj is Buffer;
  toString(encoding?: string): string;
}

// Express module declaration
declare module 'express' {
  export = express;
  function express(): any;
  namespace express {
    function Router(): any;
    interface Response {
      status(code: number): Response;
      json(body?: any): Response;
      send(body?: any): Response;
      setHeader(name: string, value: string | number): void;
    }
  }
  export type Response = express.Response;
}
