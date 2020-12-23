用于在在浏览器中显示日志，项目从[debug](https://github.com/visionmedia/debug/)修改而来，主要是减小仓库大小。

### Formatters

调试使用[printf-style](https://wikipedia.org/wiki/Printf_format_string)的格式。以下是官方支持的格式化程序：

| Formatter |  表现                                                        |
| --------- | ----------------------------------------------------------- |
| `%O`      | 在多行上漂亮地打印对象。                                        |
| `%o`      | 将对象漂亮地打印在一行上。                                      |
| `%s`      | 字符串.                                                      |
| `%d`      | 数字（整数和浮点数）。                                         |
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
