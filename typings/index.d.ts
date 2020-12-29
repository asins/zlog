export interface IDebugger {
  (formatter: any, ...args: any[]): void;
  enabled: boolean;
  log: (...args: any[]) => any;
  destroy: () => boolean;
}

interface Formatters {
  [formatter: string]: (v: any) => string;
}

export interface IDebug {
  (namespace: string, color?: boolean | string): IDebugger;
  coerce: (val: any) => any;
  disable: () => string;
  enable: (namespaces: string) => void;
  enabled: (namespaces: string) => boolean;
  selectColor: (namespaces: string) => string;
  log: (...args: any[]) => any;

  formatters: Formatters;
}

const createDebug: IDebug;

export default createDebug;

export const show2Html: (debug: IDebug) => void;
