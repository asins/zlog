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
const formatters = {};
const colors = createColors();
function createColors() {
    const colors = [];
    for (let a = 0; a <= 0xf; a += 3) {
        const a16 = a.toString(16);
        for (let b = 0; b <= 0xf; b += 3) {
            const b16 = b.toString(16);
            for (let c = 0; c <= 0xf; c += 3) {
                const c16 = c.toString(16);
                if (!(a === 0 && b <= 9 && c < 0xc)
                    && !(a > 9 && b > 9 && c > 9))
                    colors.push(`#${a16}${a16}${b16}${b16}${c16}${c16}`);
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
function save(namespaces) {
    try {
        if (namespaces) {
            storage.setItem('debug', namespaces);
        }
        else {
            storage.removeItem('debug');
        }
    }
    catch (error) {
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
function load() {
    let r;
    try {
        r = storage.getItem('debug');
    }
    catch (error) {
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
function useColors() {
    // NB: In an Electron preload script, document will be defined but not fully
    // initialized. Since we know we're in Chrome, we'll just detect this case
    // explicitly
    const win = window;
    if (typeof win !== 'undefined' && win.process && (win.process.type === 'renderer' || win.process.__nwjs)) {
        return true;
    }
    // Internet Explorer and Edge do not support colors.
    if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
    }
    // Is webkit? http://stackoverflow.com/a/16459606/376773
    // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
        // Is firebug? http://stackoverflow.com/a/398120/376773
        (typeof win !== 'undefined' && win.console && (win.console.firebug || (win.console.exception && win.console.table))) ||
        (typeof navigator !== 'undefined' && navigator.userAgent && (
        // Is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
            // Double check webkit in userAgent just in case we are in a worker
            navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/)));
}
/**
 * 通过名称空间启用调试模式。这可以包括用冒号和通配符分隔的模式。
 *
 * @param {String} namespaces
 * @api public
 */
function enable(namespaces) {
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
            skips.push(new RegExp(`^${namespaces.substr(1)}$`));
        }
        else {
            names.push(new RegExp(`^${namespaces}$`));
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
        ...skips.map(toNamespace).map((namespace) => `-${namespace}`),
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
function coerce(val) {
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
function selectColor(namespace) {
    let hash = 0;
    for (let i = 0; i < namespace.length; i++) {
        hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return colors[Math.abs(hash) % colors.length];
}
/**
 * @api public
 */
const log = console.log || (() => { });
// 设置默认显示的日志
enable(load());

var common = /*#__PURE__*/Object.freeze({
  __proto__: null,
  formatters: formatters,
  colors: colors,
  save: save,
  load: load,
  useColors: useColors,
  enable: enable,
  disable: disable,
  enabled: enabled,
  coerce: coerce,
  selectColor: selectColor,
  log: log
});

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
        return `${Math.round(ms / oneHour)}h`;
    }
    if (ms >= oneMinute) {
        return `${Math.round(ms / oneMinute)}m`;
    }
    if (ms >= oneSecond) {
        return `${Math.round(ms / oneSecond)}s`;
    }
    return `${ms}ms`;
}
/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */
function formatArgs(self, namespace, color, args, diff) {
    args[0] = `${(color ? '%c' : '') +
        namespace + (color ? ' %c' : ' ') +
        args[0] + (color ? '%c ' : ' ')}+${humanize(diff)}`;
    const c = `color: ${color}`;
    // The final "%c" is somewhat tricky, because there could be other
    // arguments passed either before or after the %c, so we need to
    // figure out the correct index to insert the CSS into
    // 最后的“％c”有点棘手，因为在％c之前或之后可能还会传递其他参数，因此我们需要找出正确的索引以将CSS插入
    let index = 0;
    let lastC = 0;
    args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
        if (match === '%%') {
            return;
        }
        index++;
        // Apply any `formatters` transformations
        const formatter = formatters[format];
        if (typeof formatter === 'function') {
            const val = args[index];
            match = formatter.call(self, val);
            // Now we need to remove `args[index]` since it's inlined in the `format`
            args.splice(index, 1);
            index--;
        }
        else if (match === '%c') {
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
function createDebug(namespace, canUseColor) {
    // 上次日志记录的时间
    let prevTime;
    // 是否允许输出日志
    let enableOverride = null;
    let color;
    if (canUseColor === true || useColors()) {
        color = selectColor(namespace);
    }
    function debug(...args) {
        // Disabled?
        if (!debug.enabled) {
            return;
        }
        const currTime = performance.now();
        const diff = currTime - (prevTime || currTime);
        prevTime = currTime;
        args[0] = coerce(args[0]);
        if (typeof args[0] !== 'string') {
            // Anything else let's inspect with %O
            args.unshift('%O');
        }
        // Apply env-specific formatting (colors, etc.)
        formatArgs(debug, namespace, color, args, diff);
        const logFn = debug.log || createDebug.log;
        logFn.apply(debug, args);
    }
    Object.defineProperty(debug, 'enabled', {
        enumerable: true,
        configurable: false,
        get: () => (enableOverride === null ? enabled(namespace) : enableOverride),
        set: (v) => {
            enableOverride = v;
        },
    });
    return debug;
}
Object.assign(createDebug, common);

createDebug.enable('*'); // 对所有日志模式设置显示规则
// showInHtml(Debug);
const debugTestFormatters = createDebug('test:format');
const obj = { a: 'tedt', b: 123, c: [1, 2, 'test'] };
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('对象漂亮的多行显示:%O', obj);
debugTestFormatters('对象漂亮的显示在一行中:%o', obj);
debugTestFormatters('显示字符串: %o', '这是一个字符串变量的内容');
debugTestFormatters('整数和浮点数显示: %d, %f', 123, 3.1415926);
debugTestFormatters('百分号不占用参数位: %%, test', 234, 'test');
const appLog = createDebug('test:log');
appLog('log');
const appLogger = createDebug('logger:debugger');
appLogger('debugger');
// 设置日志显示规则
createDebug.enable('name:*, -name:input');
// 定义debug
const logInput = createDebug('name:input');
const logOutput = createDebug('name:output');
const logCtrl = createDebug('name:ctrl');
// 打印日志
logInput('test input'); // 当前namespace中不会显示
logOutput('test output');
logCtrl('test ctrl');
setTimeout(() => {
    console.log('logInput日志模式是否允许显示:', logInput.enabled);
    logInput.enabled = true; // 单独针对logInput模式开启日志显示
    console.log('通过namespace查询日志模式是否显示(不支持通配符)', createDebug.enabled('name:output'));
    logInput('test input timeout');
    logOutput('test output timeout');
    logCtrl('test ctrl timeout');
}, 100);
// 是否将日志显示在网页中
// function showInHtml(Debug) {
//   const $el = document.createElement('div');
//   $el.setAttribute('class', 'debug-container');
//   $el.style.cssText = 'width:40vw;max-height:90vh;overflow:auto;' +
//   'position:fixed;top:0;right:0;padding:5px 10px;' + // pointer-events: none;' +
//   'background:rgba(0,0,0,.4);color:white;font-size:12px;';
//   document.body.appendChild($el);
//   Debug.log = (...args) => {
//     // console.log('log-->', args);
//     const argsList = args.slice(1);
//     let isUseColor = false;
//     let index = 0;
//     let style = '';
//     let html = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
//       match = argsList[index];
//       if (index === 1) style = match;
//       switch (format) {
//       // case 'O': // 在多行上漂亮地打印对象
//       // match = `<pre style="display:inline-block;vertical-align: top;margin:0;">${ JSON.stringify(match, null, 2) }</pre>`;
//       // break;
//         case 'O': // 在多行上漂亮地打印对象
//         case 'o': // 将对象漂亮地打印在一行上
//           match = `<code>${ JSON.stringify(match) }</code>`;
//           break;
//         case 'c': // 颜色
//           match = `${isUseColor ? '</span>' : '' }<span style="${match}">`;
//           isUseColor = true;
//           break;
//         case '%':
//           match = '%';
//           index -= 1;
//           break;
//       }
//       index += 1;
//       return match;
//     });
//     if (isUseColor) html += '</span>';
//     argsList.slice(index).forEach((arg) => {
//       html += `<span style="${style}"> ${arg}</span>`;
//     });
//     $el.insertAdjacentHTML('afterbegin', `<div class="item">${html}</div>`);
//   };
// }
