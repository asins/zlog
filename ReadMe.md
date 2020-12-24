用于在在浏览器中显示日志，项目从[debug](https://github.com/visionmedia/debug/)修改而来，主要是减小仓库大小。

### namespace规则

用于定义一个日志的的命令空间，用于定义此命令空间的日志在特定规则下是否显示。

特性：
- 支持同时设置多个namespace，每个使用空格或逗号分隔。如 `name1, name2:*,-name2:test`
- 支持在字符串**末尾**加 `*` 来匹配所有字符。如 `app:*`能匹配所有app:开头的namespace。
- 支持在字符串**头部**加 `-` 来排除对应的namespace。如 `-not_this:*` 能排除所有not_tihs开头的namespace。

> 注意：namespace中不要出现`%`字符，否则会对设置颜色等操作有影响

namespace的特性在设置显示哪些日志时使用，比如：

```js
const createDebug = require('debug');

// 设置日志显示规则
createDebug.enable('name:*, -name:input');

// 定义debug
const input = createDebug('name:input');
const output = createDebug('name:output');
const ctrl = createDebug('name:ctrl');

// 打印日志
input('test input'); // 当前namespace规则，此日志不会显示
input('test output');
input('test ctrl');
```

### Formatters

调试使用[printf-style](https://wikipedia.org/wiki/Printf_format_string)的格式。以下是官方支持的格式化程序：

| Formatter |  表现                                                        |
| --------- | ----------------------------------------------------------- |
| `%O`      | 在多行上漂亮地打印对象。                                        |
| `%o`      | 将对象漂亮地打印在一行上。                                      |
| `%s`      | 字符串.                                                      |
| `%d`      | 数字（对浮点数会取整)                                          |
| `%f`      | 浮点数字                                                     |
| `%j`      | JSON。如果参数包含循环引用，则替换为字符串“ [Circular]”。         |
| `%%`      | 单个百分号（'％'）。这不消耗参数。                               |

修改格式对象:

```js
const createDebug = require('debug');
createDebug.formatters.h = (v) => {
  return v.toString('hex');
}

// …elsewhere
const debug = createDebug('foo');
debug('this is hex: %h', new Buffer('hello world'));
//   foo this is hex: 68656c6c6f20776f726c6421 +0ms
```
