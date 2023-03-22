'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const colorData = "00C00F03C03F06C06F09C09F0C00C30C60C90CC0CF30C30F33C33F36C36F39C39F3C03C33C63C93CC3CF60C60F63C63F6C06C390C90F93C93F9C09C3C00C03C06C09C0CC0FC30C33C36C39C3CC3FC60C63C90C93CC0F03F06F09F0CF30F33F36F39F60F63F90F93FC0";
const names = [];
const skips = [];
const colors = colorData.match(/\w{3}/g).map((c3) => `#${c3.replace(/\w/g, "$&$&")}`);
const common = {
  formatters: {},
  canUseColor: true,
  log: (...args) => {
    console.log.apply(console, args);
  },
  enable,
  enabled,
  disable
};
function save(namespaces) {
  try {
    const storage = window.localStorage;
    if (namespaces) {
      storage.setItem("debug", namespaces);
    } else {
      storage.removeItem("debug");
    }
  } catch (error) {
  }
}
function load() {
  let r;
  try {
    const storage = window.localStorage;
    r = storage.getItem("debug");
  } catch (error) {
  }
  return r;
}
function enable(namespaces) {
  save(namespaces);
  names.length = 0;
  skips.length = 0;
  let i;
  const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
  const len = split.length;
  for (i = 0; i < len; i++) {
    if (!split[i]) {
      continue;
    }
    namespaces = split[i].replace(/\*/g, ".*?");
    if (namespaces[0] === "-") {
      skips.push(new RegExp(`^${namespaces.substr(1)}$`));
    } else {
      names.push(new RegExp(`^${namespaces}$`));
    }
  }
}
function disable() {
  const namespaces = [
    ...names.map(toNamespace),
    ...skips.map(toNamespace).map((namespace) => `-${namespace}`)
  ].join(",");
  enable("");
  return namespaces;
}
function enabled(name) {
  if (name[name.length - 1] === "*") {
    return true;
  }
  let i;
  let len;
  for (i = 0, len = skips.length; i < len; i++) {
    if (skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = names.length; i < len; i++) {
    if (names[i].test(name)) {
      return true;
    }
  }
  return false;
}
function toNamespace(regexp) {
  const name = regexp.toString();
  return name.substring(2, name.length - 2).replace(/\.\*\?$/, "*");
}
function coerce(val) {
  if (val instanceof Error) {
    return val.stack || val.message;
  }
  return val;
}
function selectColor(namespace) {
  let hash = 0;
  for (let i = 0; i < namespace.length; i++) {
    hash = (hash << 5) - hash + namespace.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}
enable(load());

const oneSecond = 1e3;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;
function humanize(ms) {
  ms = parseInt(ms, 10);
  let suff = "ms";
  if (ms >= oneHour) {
    ms /= oneHour;
    suff = "h";
  } else if (ms >= oneMinute) {
    ms /= oneMinute;
    suff = "m";
  } else if (ms >= oneSecond) {
    ms /= oneSecond;
    suff = "s";
  }
  return `${Math.round(ms * 10) / 10}${suff}`;
}
function formatArgs(self, namespace, color, args, diffTime) {
  const isColorSpace = color ? " %c" : " ";
  args[0] = `${color ? "%c" : ""}${namespace} +${humanize(diffTime)}${isColorSpace}${args[0]}${isColorSpace}`;
  const c = `color: ${color}`;
  let index = 0;
  let lastC = 0;
  args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    if (match === "%%") {
      return;
    }
    index++;
    const formatter = common.formatters[format];
    if (typeof formatter === "function") {
      const val = args[index];
      match = formatter.call(self, val);
      args.splice(index, 1);
      index--;
    } else if (match === "%c") {
      lastC = index;
    }
  });
  if (color) {
    args.splice(1, 0, c, "color: inherit");
    args.splice(lastC, 0, c);
  }
}
function createDebug(namespace, canUseColor) {
  let prevTime;
  let enableOverride = null;
  const color = selectColor(namespace);
  function debug(...args) {
    if (!debug.enabled) {
      return;
    }
    const currTime = +new Date();
    const diffTime = currTime - (prevTime || currTime);
    prevTime = currTime;
    args[0] = coerce(args[0]);
    if (typeof args[0] !== "string") {
      args.unshift("%O");
    }
    const hasColor = canUseColor !== void 0 ? canUseColor : common.canUseColor === void 0 || common.canUseColor;
    const curColorStr = hasColor ? color : null;
    formatArgs(debug, namespace, curColorStr, args, diffTime);
    const logFn = debug.log || createDebug.log;
    logFn.apply(debug.log ? debug : createDebug, args);
  }
  Object.defineProperty(debug, "enabled", {
    enumerable: true,
    configurable: false,
    get: () => enableOverride === null ? common.enabled(namespace) : enableOverride,
    set: (v) => {
      enableOverride = v;
    }
  });
  return debug;
}
let winZlog = window.__ZLOG_COMMON;
if (!winZlog) {
  winZlog = Object.assign(createDebug, common);
  Object.defineProperty(winZlog, "canUseColor", {
    enumerable: true,
    configurable: false,
    get: () => common.canUseColor,
    set: (v) => {
      common.canUseColor = v;
    }
  });
  window.__ZLOG_COMMON = winZlog;
}
var winZlog$1 = winZlog;

exports["default"] = winZlog$1;
