const LOCAL_NAME = 'debug';
const oneSecond = 1000;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;

/**
 * 当前活动的调试模式名称以及要跳过的名称。
 */
const names = []; // 要显示的模块名称列表
const skips = []; // 要跳过的模块名称列表

function letterEach(prefix: string): string[] {
  const letterArr = '0369CF'.split('');
  return letterArr.map((letter) => `${prefix}${letter}${letter}`);
}
const colors = letterEach('#')
  .reduce((res, c) => res.concat(letterEach(c)), [])
  .reduce((res, c) => res.concat(letterEach(c)), [])
  .filter((c) => !/#([A-F0-9])\1{5}|[0F]{4}/.test(c))

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
export function save(namespaces) {
  try {
    const storage = window.localStorage;
    if (namespaces) {
      storage.setItem(LOCAL_NAME, namespaces);
    } else {
      storage.removeItem(LOCAL_NAME);
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
    const storage = window.localStorage;
    r = storage.getItem(LOCAL_NAME);
  } catch (error) {
    // Swallow
    // XXX (@Qix-) should we be logging these?

    // If debug isn't set in LS, try to load by url??
    // const urlR = /\bDEBUG=([^&#$]+)/.exec(window.location.search);
    // if(urlR) r = decodeURIComponent(urlR[1]);
  }


  return r;
}

/**
 * 通过名称空间启用调试模式。这可以包括用冒号和通配符分隔的模式。
 *
 * @param {String} namespaces
 * @api public
 */
export function commonEnable(namespaces) {
  save(namespaces);

  // 清空数组并保留引用句柄
  names.length = 0;
  skips.length = 0;

  let i: number;
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
export function commonDisable() {
  const namespaces = [
    ...names.map(toNamespace),
    ...skips.map(toNamespace).map((namespace) => `-${ namespace}`),
  ].join(',');
  commonEnable('');
  return namespaces;
}

/**
 * 如果启用了给定的模式名称，则返回true，否则返回false。
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */
export function commonEnabled(name) {
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
  const name = regexp.toString();
  return name.substring(2, name.length - 2)
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
 * 为毫秒时间加上单位
 * @param {Number} ms 毫秒
 */
export function humanize(ms) {
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
 */
export function formatArgs(namespace, color, args, diffTime) {
  const isColorSpace = color ? ' %c' : ' ';
  args[0] = `${color ? '%c' : ''}${namespace} +${humanize(diffTime)}${isColorSpace}${args[0]}${isColorSpace}`;

  const c = `color:${color}`;

  // 最后的“％c”有点棘手，因为在％c之前或之后可能还会传递其他参数，因此我们需要找出正确的索引以将CSS插入
  let index = 0;
  let lastC = 0;
  // https://en.wikipedia.org/wiki/Printf_format_string
  args[0].replace(/%([a-zA-Z%])/g, (match) => {
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

// 设置默认显示的日志
commonEnable(load());
