import { coerce, selectColor, commonEnable, commonEnabled, commonDisable, formatArgs } from './common';

const WindowName = '__ZLOG_COMMON';


/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */
function createDebug(namespace: string, canUseColor?: boolean) {
  // 上次日志记录的时间
  let prevTime: number;

  // 是否允许输出日志
  let enableOverride: boolean | null = null;

  const color = selectColor(namespace);

  function debug(...args) {
    // Disabled?
    if (!(debug as Debugger).enabled) {
      return;
    }

    const currTime = +(new Date());
    const diffTime = currTime - (prevTime || currTime);
    prevTime = currTime;

    args[0] = coerce(args[0]);

    if (typeof args[0] !== 'string') {
      // Anything else let's inspect with %O
      args.unshift('%O');
    }

    const hasColor = canUseColor !== undefined ? canUseColor : (createDebug.canUseColor === undefined || createDebug.canUseColor);
    const curColorStr = hasColor ? color : null;

    // 应用特定于环境的格式
    formatArgs(namespace, curColorStr, args, diffTime);

    const logFn = (debug as Debugger).log || (createDebug as CreateDebug).log;
    logFn.apply((debug as Debugger).log ? debug : createDebug, args);
  }

  Object.defineProperty(debug, 'enabled', {
    enumerable: true,
    configurable: false,
    get: () => (enableOverride === null ? commonEnabled(namespace) : enableOverride),
    set: (v) => {
      enableOverride = v;
    },
  });

  return debug as Debugger;
}

/**
 * 对全局日志设置是否允许使用颜色
 */
createDebug.canUseColor = true;

/**
 * @api public
 */
createDebug.log = (...args) => {
  console.log.apply(console, args);
},
createDebug.enable = commonEnable;
createDebug.enabled = commonEnabled;
createDebug.disable = commonDisable;

// 让多JS文件时共用一份配置
let winZlog: CreateDebug = window[WindowName];
if (!winZlog) {
  winZlog = window[WindowName] = createDebug;
}

export default winZlog as CreateDebug;


declare global {
  interface Window {
    // 多个文件时共用debug配置
    __ZLOG_COMMON: CreateDebug;
  }
}

export interface Debugger {
  (formatter: any, ...args: any[]): void;

  enabled: boolean;
  log: (...args: any[]) => any;
}

export interface CreateDebug {
  (namespace: string, canUseColor?: boolean): Debugger;
  disable: () => string;
  enable: (namespaces: string) => void;
  enabled: (namespaces: string) => boolean;
  log: (...args: any[]) => any;

  canUseColor: boolean;
}
