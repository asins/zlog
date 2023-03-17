import { IDebug, IDebugger } from './index.d';
import { common, coerce, selectColor } from './common';

const oneSecond = 1000;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;

/**
 * 为毫秒时间加上单位
 * @param {Number} ms 毫秒
 */
function humanize(ms) {
  ms = parseInt(ms, 10);
  let suff = 'ms';
  if (ms >= oneHour) {
    ms /= oneHour;
    suff = 'h';
  } else if (ms >= oneMinute) {
    ms /= oneMinute;
    suff = 'm';
  } else if (ms >= oneSecond) {
    ms /= oneSecond;
    suff = 's';
  }
  return `${Math.round(ms * 10) / 10}${suff}`;
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(self, namespace, color, args, diffTime) {
  const isColorSpace = color ? ' %c' : ' ';
  args[0] = `${color ? '%c' : ''}${namespace} +${humanize(diffTime)}${isColorSpace}${args[0]}${isColorSpace}`;

  const c = `color: ${color}`;

  // The final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  // 最后的“％c”有点棘手，因为在％c之前或之后可能还会传递其他参数，因此我们需要找出正确的索引以将CSS插入
  let index = 0;
  let lastC = 0;
  // https://en.wikipedia.org/wiki/Printf_format_string
  args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    if (match === '%%') {
      return;
    }
    index++;

    // Apply any `formatters` transformations
    const formatter = common.formatters[format];
    if (typeof formatter === 'function') {
      const val = args[index];
      match = formatter.call(self, val);

      // Now we need to remove `args[index]` since it's inlined in the `format`
      args.splice(index, 1);
      index--;
    } else if (match === '%c') {
      // We only are interested in the *last* %c (the user may have provided their own)
      lastC = index;
    }
  });

  if (color) {
    args.splice(1, 0, c, 'color: inherit');
    args.splice(lastC, 0, c);
  }
}

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
  let enableOverride: boolean = null;

  let color: string;
  const hasColor = canUseColor !== undefined ? canUseColor : (common.canUseColor === undefined || common.canUseColor);
  if (hasColor) {
    color = selectColor(namespace);
  }

  function debug(...args) {
    // Disabled?
    if (!(debug as IDebugger).enabled) {
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

    // 应用特定于环境的格式
    formatArgs(debug, namespace, color, args, diffTime);

    const logFn = (debug as IDebugger).log || (createDebug as IDebug).log;
    logFn.apply((debug as IDebugger).log ? debug : createDebug, args);
  }

  Object.defineProperty(debug, 'enabled', {
    enumerable: true,
    configurable: false,
    get: () => (enableOverride === null ? common.enabled(namespace) : enableOverride),
    set: (v) => {
      enableOverride = v;
    },
  });

  return debug as IDebugger;
}

// 让多JS文件时共用一份配置
let winZlog: IDebug = window.__ZLOG_COMMON;
if (!winZlog) {
  winZlog = Object.assign(createDebug, common);

  Object.defineProperty(winZlog, 'canUseColor', {
    enumerable: true,
    configurable: false,
    get: () => common.canUseColor,
    set: (v) => {
      common.canUseColor = v;
    },
  });

  window.__ZLOG_COMMON = winZlog;
}

export default winZlog;

// export { default as show2Html } from './show2Html';

declare global {
  interface Window {
    // 多个文件时共用debug配置
    __ZLOG_COMMON: IDebug;
  }
}
