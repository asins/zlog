import TypesDebug from '../typings/index.d';
import * as common from './common';

const oneSecond = 1000;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;

/**
 * 为毫秒时间加上单位
 * @param {Number} ms 毫秒
 */
function humanize(ms) {
  ms = parseInt(ms, 10);
  if (ms >= oneHour) {
    return `${Math.round(ms / oneHour) }h`;
  }
  if (ms >= oneMinute) {
    return `${Math.round(ms / oneMinute) }m`;
  }
  if (ms >= oneSecond) {
    return `${Math.round(ms / oneSecond) }s`;
  }
  return `${ms }ms`;
}


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(self, namespace, color, args, diff) {
  args[0] = `${(color ? '%c' : '') +
    namespace + (color ? ' %c' : ' ') +
    args[0] + (color ? '%c ' : ' ')
    }+${humanize(diff)}`;

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
function createDebug(namespace: string, canUseColor?: boolean | string) {
  // 上次日志记录的时间
  let prevTime: number;

  // 是否允许输出日志
  let enableOverride: boolean = null;

  let color: string;

  if (canUseColor === true || (canUseColor !== false && common.useColors())) {
    color = common.selectColor(namespace);
  }

  function debug(...args) {
    // Disabled?
    if (!(debug as TypesDebug.IDebugger).enabled) {
      return;
    }

    const currTime = performance.now();
    const diff = currTime - (prevTime || currTime);
    prevTime = currTime;

    args[0] = common.coerce(args[0]);

    if (typeof args[0] !== 'string') {
      // Anything else let's inspect with %O
      args.unshift('%O');
    }

    // 应用特定于环境的格式
    formatArgs(debug, namespace, color, args, diff);

    const logFn = (debug as TypesDebug.IDebugger).log || (createDebug as TypesDebug.IDebug).log;
    logFn.apply(debug, args);
  }

  Object.defineProperty(debug, 'enabled', {
    enumerable: true,
    configurable: false,
    get: () => (enableOverride === null ? common.enabled(namespace) : enableOverride),
    set: (v) => {
      enableOverride = v;
    },
  });

  return debug;
}

Object.assign(createDebug, common);

export default createDebug as TypesDebug.Debug;

export { default as show2Html } from './show2Html';
