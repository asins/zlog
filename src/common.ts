const storage = window.localStorage;

/**
* 当前活动的调试模式名称以及要跳过的名称。
*/
let names = [];
let skips = [];

/**
* 调试“ format”参数的特殊“％n”处理函数的映射。
* 有效的密钥名称是单个，小写或大写字母，即“ n”和“ N”。
*/
export const formatters = {
/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */
  j(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return `[UnexpectedJSONParseError]: ${ error.message}`;
    }
  },
};

export const colors = createColors();

function createColors() {
  const colors = [];
  for (let a = 0; a <= 0xf; a += 3) {
    const a16 = a.toString(16);
    for (let b = 0; b <= 0xf; b += 3) {
      const b16 = b.toString(16);
      for (let c = 0; c <= 0xf; c += 3) {
        const c16 = c.toString(16);
        if (
          !(a === 0 && b <= 9 && c < 0xc)
          && !(a > 9 && b > 9 && c > 9)
        ) colors.push(`#${a16}${a16}${b16}${b16}${c16}${c16}`);
      }
    }
  }
  return colors;
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
export function save(namespaces) {
  try {
    if (namespaces) {
      storage.setItem('debug', namespaces);
    } else {
      storage.removeItem('debug');
    }
  } catch (error) {
    // Swallow
    // XXX (@Qix-) should we be logging these?
  }
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
export function load() {
  let r;
  try {
    r = storage.getItem('debug');
  } catch (error) {
    // Swallow
    // XXX (@Qix-) should we be logging these?

    // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    if (typeof process !== 'undefined' && 'env' in process) {
      r = process.env.DEBUG;
    }
  }


  return r;
}

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */
export function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  const win = window as any;
  if (typeof win !== 'undefined' && win.process && (win.process.type === 'renderer' || win.process.__nwjs)) {
    return true;
  }

  // Internet Explorer and Edge do not support colors.
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    return false;
  }

  // Is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && (document.documentElement.style as any).WebkitAppearance) ||
    // Is firebug? http://stackoverflow.com/a/398120/376773
    (typeof win !== 'undefined' && win.console && ((win.console as any).firebug || (win.console.exception && win.console.table))) ||
    (typeof navigator !== 'undefined' && navigator.userAgent && (
      // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
      // Double check webkit in userAgent just in case we are in a worker
      navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/)
    ));
}

/**
* Enables a debug mode by namespaces. This can include modes
* separated by a colon and wildcards.
*
* @param {String} namespaces
* @api public
*/
export function enable(namespaces) {
  save(namespaces);

  names = [];
  skips = [];

  let i;
  const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  const len = split.length;

  for (i = 0; i < len; i++) {
    if (!split[i]) {
      // ignore empty strings
      continue;
    }

    namespaces = split[i].replace(/\*/g, '.*?');

    if (namespaces[0] === '-') {
      skips.push(new RegExp(`^${ namespaces.substr(1) }$`));
    } else {
      names.push(new RegExp(`^${ namespaces }$`));
    }
  }
}

/**
  * Disable debug output.
  *
  * @return {String} namespaces
  * @api public
  */
export function disable() {
  const namespaces = [
    ...names.map(toNamespace),
    ...skips.map(toNamespace).map((namespace) => `-${ namespace}`),
  ].join(',');
  enable('');
  return namespaces;
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */
export function enabled(name) {
  if (name[name.length - 1] === '*') {
    return true;
  }

  let i;
  let len;

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
  *
  * @param {RegExp} regxep
  * @return {String} namespace
  * @api private
  */
function toNamespace(regexp) {
  return regexp.toString()
    .substring(2, regexp.toString().length - 2)
    .replace(/\.\*\?$/, '*');
}

/**
  * Coerce `val`.
  *
  * @param {Mixed} val
  * @return {Mixed}
  * @api private
  */
export function coerce(val) {
  if (val instanceof Error) {
    return val.stack || val.message;
  }
  return val;
}
/**
 * Selects a color for a debug namespace
 * @param {String} namespace The namespace string for the for the debug instance to be colored
 * @return {Number|String} An ANSI color code for the given namespace
 * @api private
 */
export function selectColor(namespace) {
  let hash = 0;

  for (let i = 0; i < namespace.length; i++) {
    hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
export const log = console.debug || console.log || (() => {});

// 设置默认显示的日志
enable(load());
