import window from 'global/window';
import { selectColor } from './color';
import { humanize } from './time';

const WindowName = '__ZLOG';
const LOCAL_NAME = 'debug';
const names = [] as RegExp[]; // 要显示的模块名称列表
const skips = [] as RegExp[]; // 要跳过的模块名称列表

/**
 * Coerce `val`.
 */
export function coerce(val: any) {
  if (val instanceof Error) {
    return val.stack || val.message;
  }
  return val;
}

/**
 * Save `namespaces`.
 */
function save(namespaces: string) {
  try {
    const { store } = createDebug;
    if (namespaces) {
      store.setItem(LOCAL_NAME, namespaces);
    } else {
      store.removeItem(LOCAL_NAME);
    }
  } catch (error) {
    // Swallow
    // XXX (@Qix-) should we be logging these?
  }
}

/**
 * Load `namespaces`.
 */
function load(): string {
  try {
    const { store } = createDebug;
    return store.getItem(LOCAL_NAME);
  } catch (error) {
    // Swallow
    // XXX (@Qix-) should we be logging these?
    // If debug isn't set in LS, try to load by url??
    // const urlR = /\bDEBUG=([^&#$]+)/.exec(window.location.search);
    // if(urlR) r = decodeURIComponent(urlR[1]);
  }
  return '';
}

function commonAdd(namespaces: string) {
  let i: number;
  const split = namespaces.split(/[\s,]+/);
  const len = split.length;

  for (i = 0; i < len; i++) {
    if (!split[i]) {
      // ignore empty strings
      continue;
    }

    namespaces = split[i].replace(/\*/g, '.*?');

    if (namespaces[0] === '-') {
      skips.push(new RegExp(`^${namespaces.substr(1)}$`));
    } else {
      names.push(new RegExp(`^${namespaces}$`));
    }
  }
}

/**
 * 通过名称空间启用调试模式。这可以包括用冒号和通配符分隔的模式。
 * @param {String} namespaces 打开的命名空间，多个用逗号分隔
 * @api public
 */
function commonEnable(namespaces: string) {
  save(namespaces);

  // 清空数组并保留引用句柄
  names.length = 0;
  skips.length = 0;

  commonAdd(namespaces);
}

function commonNamespaces(): string {
  const namespaces = {} as { [key: string]: boolean };
  names
    .map(toNamespace)
    .concat(skips.map((namespace) => `-${toNamespace(namespace)}`))
    .forEach((namespace) => {
      namespaces[namespace] = true;
    });
  return Object.keys(namespaces).join(',');
}

/**
 * Disable debug output.
 */
function commonDisable(): string {
  const namespaces = commonNamespaces();
  commonEnable('');
  return namespaces;
}

/**
 * 检测指定命名空间是否已启用，则返回true，否则返回false。
 */
export function commonEnabled(name: string) {
  if (name === '*') return true;

  let i: number;
  let len: number;

  // 是否跳过
  for (i = 0, len = skips.length; i < len; i++) {
    if (skips[i].test(name)) {
      return false;
    }
  }

  // 是否显示
  for (i = 0, len = names.length; i < len; i++) {
    if (names[i].test(name)) {
      return true;
    }
  }

  return false;
}

/**
 * Convert regexp to namespace
 */
function toNamespace(regexp: RegExp): string {
  const name = regexp.toString();
  return name.substring(2, name.length - 2).replace(/\.\*\?$/, '*');
}

/**
 * Colorize log arguments if enabled.
 */
function formatArgs(
  namespace: string,
  color: string | undefined,
  args: any[],
  diffTime: number,
) {
  const isColorSpace = color ? ' %c' : ' ';
  args[0] = `${color ? '%c' : ''}${namespace} +${humanize(diffTime)}${isColorSpace}${args[0]}${isColorSpace}`;

  const c = `color:${color}`;

  // 最后的“％c”有点棘手，因为在％c之前或之后可能还会传递其他参数，因此我们需要找出正确的索引以将CSS插入
  let index = 0;
  let lastC = 0;
  // https://en.wikipedia.org/wiki/Printf_format_string
  args[0].replace(/%([a-zA-Z%])/g, (match: string) => {
    if (match === '%%') return;

    index++;

    if (match === '%c') {
      lastC = index;
    }
  });

  if (color) {
    args.splice(1, 0, c, 'color:inherit');
    args.splice(lastC, 0, c);
  }
}

export interface Debugger {
  (formatter: any, ...args: any[]): void;

  enabled: boolean;
  log: (...args: any[]) => any;
}

export interface Store {
  setItem: (name: string, val: string) => void;
  removeItem: (name: string) => void;
  getItem: (name: string) => string | null;
}

// export interface CreateDebug {
//   (namespace: string, canUseColor?: boolean): Debugger;
//   disable: () => string;
//   enable: (namespaces: string) => void;
//   enabled: (namespaces: string) => boolean;
//   log: (...args: any[]) => any;

//   canUseColor: boolean;
//
// }

/**
 * 使用给定的“命名空间”创建一个调试器。
 */
export function createDebug(namespace: string, canUseColor?: boolean) {
  // 上次日志记录的时间
  let prevTime: number;

  // 是否允许输出日志，默认显示
  let enableOverride: boolean | undefined;

  const color = selectColor(namespace);

  function debug(...args: any[]) {
    // Disabled?
    if (!(debug as Debugger).enabled) {
      return;
    }

    const currTime = Date.now();
    const diffTime = currTime - (prevTime || currTime);
    prevTime = currTime;

    args[0] = coerce(args[0]);

    const hasColor =
      canUseColor !== undefined ? canUseColor : createDebug.canUseColor;
    const curColorStr = hasColor ? color : undefined;

    // 应用特定于环境的格式
    formatArgs(namespace, curColorStr, args, diffTime);

    const logFn = (debug as Debugger).log || createDebug.log;
    logFn(...args);
  }

  Object.defineProperty(debug, 'enabled', {
    enumerable: true,
    configurable: false,
    get: () => {
      return enableOverride === undefined
        ? commonEnabled(namespace)
        : enableOverride;
    },
    set: (v: boolean) => {
      enableOverride = v;
    },
  });

  return debug as Debugger;
}

/**
 * 对全局日志设置是否允许使用颜色
 */
createDebug.canUseColor = true;
createDebug.log = (...args: any[]) => {
  console.log(...args);
};
createDebug.enable = commonEnable;
createDebug.disable = commonDisable;
createDebug.enabled = commonEnabled;
createDebug.store = window.localStorage as Store;

export type CreateDebug = typeof createDebug;

// 让多JS文件时共用一份配置
let winZlog: CreateDebug = window[WindowName];
if (!winZlog) {
  winZlog = window[WindowName] = createDebug;
  // 设置默认显示的日志
  commonAdd(load());
}

export default winZlog as CreateDebug;

declare global {
  interface Window {
    // 多个文件时共用debug配置
    __ZLOG: CreateDebug;
  }
}
