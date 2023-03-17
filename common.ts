const colorData = '00C00F03C03F06C06F09C09F0C00C30C60C90CC0CF30C30F33C33F36C36F39C39F3C03C33C63C93CC3CF60C60F63C63F6C06C390C90F93C93F9C09C3C00C03C06C09C0CC0FC30C33C36C39C3CC3FC60C63C90C93CC0F03F06F09F0CF30F33F36F39F60F63F90F93FC0';

/**
 * 当前活动的调试模式名称以及要跳过的名称。
 */
const names = [];
const skips = [];

const colors = colorData.match(/\w{3}/g).map((c3) => `#${c3.replace(/\w/g, '$&$&')}`);

export const common = {
  /**
   * 调试“ format”参数的特殊“％n”处理函数的映射。
   * 有效的密钥名称是单个，小写或大写字母，即“ n”和“ N”。
   */
  formatters: {},

  /**
   * 对全局日志设置是否允许使用颜色
   */
  canUseColor: true,

  /**
   * @api public
   */
  log: (...args) => {
    console.log.apply(console, args);
  },

  enable,
  enabled,
  disable,
};

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
export function save(namespaces) {
  // console.log('common save:', namespaces);
  try {
    const storage = window.localStorage;
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
    const storage = window.localStorage;
    r = storage.getItem('debug');
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
function enable(namespaces) {
  save(namespaces);

  // 清空数组并保留引用句柄
  names.length = 0;
  skips.length = 0;

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
function disable() {
  const namespaces = [
    ...names.map(toNamespace),
    ...skips.map(toNamespace).map((namespace) => `-${ namespace}`),
  ].join(',');
  enable('');
  return namespaces;
}

/**
 * 如果启用了给定的模式名称，则返回true，否则返回false。
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */
function enabled(name) {
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

// 设置默认显示的日志
enable(load());
