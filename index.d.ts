export interface IDebugger {
  (formatter: any, ...args: any[]): void;
  enabled: boolean;
  log: (...args: any[]) => any;
}

interface Formatters {
  [formatter: string]: (v: any) => string;
}

export interface IDebug {
  (namespace: string, color?: boolean): IDebugger;
  disable: () => string;
  enable: (namespaces: string) => void;
  enabled: (namespaces: string) => boolean;
  log: (...args: any[]) => any;

  canUseColor: boolean;

  formatters: Formatters;
}

export default IDebug;

export const show2Html: (debug: IDebug) => void;
