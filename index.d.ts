/* eslint-disable no-var */
/* eslint-disable no-redeclare */
declare namespace debug {
  interface Debugger {
    (formatter: any, ...args: any[]): void;

    enabled: boolean;
    log: (...args: any[]) => any;
  }

  interface Formatters {
    [formatter: string]: (v: any) => string;
  }

  interface Debug {
    (namespace: string, canUseColor?: boolean): Debugger;
    disable: () => string;
    enable: (namespaces: string) => void;
    enabled: (namespaces: string) => boolean;
    log: (...args: any[]) => any;

    canUseColor: boolean;

    formatters: Formatters;
  }

  type IDebug = Debug;

  type IDebugger = Debugger;
}

declare var debug: debug.Debug & { debug: debug.Debug; default: debug.Debug };

export = debug;
export as namespace debug;
