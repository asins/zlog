import { IDebug, IDebugger } from '../typings/index.d';
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

function formatArgs(namespace, color, args, diff) {
  args[0] = `${(color ? '%c' : '') +
    namespace + (color ? ' %c' : ' ') +
    args[0] + (color ? '%c ' : ' ')
    }+${humanize(diff)}`;

  if (!color) {
    return;
  }

  const c = `color: ${color}`;
  args.splice(1, 0, c, 'color: inherit');

  // The final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  let index = 0;
  let lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, (match) => {
    if (match === '%%') {
      return;
    }
    index++;
    if (match === '%c') {
      // We only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
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

  if (canUseColor === true || common.useColors()) {
    color = common.selectColor(namespace);
  }

  Object.defineProperty(debug, 'enabled', {
    enumerable: true,
    configurable: false,
    get: () => (enableOverride === null ? common.enabled(namespace) : enableOverride),
    set: (v) => {
      enableOverride = v;
    },
  });

  function debug(...args) {
    // Disabled?
    if (!(debug as IDebugger).enabled) {
      return;
    }

    const currTime = Date.now();
    const diff = currTime - (prevTime || currTime);
    prevTime = currTime;

    args[0] = common.coerce(args[0]);

    if (typeof args[0] !== 'string') {
      // Anything else let's inspect with %O
      args.unshift('%O');
    }

    // Apply any `formatters` transformations
    let index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
      // If we encounter an escaped % then don't increase the array index
      if (match === '%%') {
        return '%';
      }
      index++;
      const formatter = common.formatters[format];
      if (typeof formatter === 'function') {
        const val = args[index];
        match = formatter.call(debug, val);

        // Now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // Apply env-specific formatting (colors, etc.)
    formatArgs(namespace, color, args, diff);

    const logFn = (debug as IDebugger).log || common.log;
    logFn.apply(debug, args);
  }

  return debug;
}

Object.assign(createDebug, common);

export default createDebug as IDebug;

