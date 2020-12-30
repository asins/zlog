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
  disable: () => string;
  enable: (namespaces: string) => void;
  enabled: (namespaces: string) => boolean;
  log: (...args: any[]) => any;

  formatters: Formatters;
}

const createDebug: IDebug;

export default createDebug;

export const show2Html: (debug: IDebug) => void;

declare global {
  interface Window {
    // 多个文件时共用debug配置
    __ZLOG_COMMON: IDebug;
  }
}
