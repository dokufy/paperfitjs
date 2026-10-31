declare module 'pagedjs' {
  export class Previewer {
    constructor(options?: any);
    preview(content?: any, stylesheets?: any, renderTo?: any): Promise<any>;
    registerHandlers(...handlers: any[]): void;
  }

  export class Handler {
    constructor(chunker?: any, polisher?: any, caller?: any);
  }

  export function registerHandlers(...handlers: any[]): void;
  export function initializeHandlers(
    chunker: any,
    polisher: any,
    caller: any,
  ): any;
  export const registeredHandlers: any[];
}
