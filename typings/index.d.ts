interface Debugger {
  (formatter: any, ...args: any[]): void;

  enabled: boolean;
  log: (...args: any[]) => any;
  destroy: () => boolean;
}

interface Formatters {
  [formatter: string]: (v: any) => string;
}

interface Debug {
  (namespace: string, color?: boolean | string): Debugger;
  coerce: (val: any) => any;
  disable: () => string;
  enable: (namespaces: string) => void;
  enabled: (namespaces: string) => boolean;
  selectColor: (namespaces: string) => string;
  log: (...args: any[]) => any;

  formatters: Formatters;
}

export type IDebug = Debug;

export type IDebugger = Debugger;
