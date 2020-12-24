import Debug from '../src/index';

Debug.enable('*'); // 对所有日志模式设置显示规则

show2Html(Debug);

const debugTestFormatters = Debug('test:format');
const obj = { a: 'tedt', b: 123, c: [1, 2, 'test'] };
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('对象漂亮的多行显示:%O', obj);
debugTestFormatters('对象漂亮的显示在一行中:%o', obj);
debugTestFormatters('显示字符串: %o', '这是一个字符串变量的内容');
debugTestFormatters('整数和浮点数显示: %d, %f', 123, 3.1415926);
debugTestFormatters('百分号不占用参数位: %%, test', 234, 'test');
debugTestFormatters('不支持的参数位情况: %t, tt-%x-tt', 234, 'test');

const appLog = Debug('test:log');
appLog('log');

// 不显示日志颜色
const testNoColor = Debug('logger:debugger', false);
testNoColor('测试不使用颜色: %s', '此内容无特殊颜色');


// 设置日志显示规则
Debug.enable('name:*, -name:input');

// 定义debug
const logInput = Debug('name:input');
const logOutput = Debug('name:output');
const logCtrl = Debug('name:ctrl');

// 打印日志
logInput('test input'); // 当前namespace中不会显示
logOutput('test output');
logCtrl('test ctrl');

setTimeout(() => {
  console.log('logInput日志模式是否允许显示:', logInput.enabled);
  logInput.enabled = true; // 单独针对logInput模式开启日志显示
  console.log('通过namespace查询日志模式是否显示(不支持通配符)', Debug.enabled('name:output'));
  logInput('test input timeout');
  logOutput('test output timeout');
  logCtrl('test ctrl timeout');
}, 100);

// 是否将日志显示在网页中
function show2Html(Debug) {
  const $el = document.createElement('div');
  $el.setAttribute('class', 'debug-container');
  $el.style.cssText = 'width:40vw;max-height:90vh;overflow:auto;' +
  'position:fixed;top:0;right:0;padding:5px 10px;' +
  'background:rgba(0,0,0,.4);color:white;font-size:12px;';
  document.body.appendChild($el);
  Debug.log = (...args) => {
    // console.log('log-->', args);
    const argsList = args.slice(1);
    let isUseColor = false;
    let index = 0;
    let style = '';
    let html = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
      match = argsList[index];
      if (index === 1) style = match;
      switch (format) {
      // case 'O': // 在多行上漂亮地打印对象
      // match = `<pre style="display:inline-block;vertical-align: top;margin:0;">${ JSON.stringify(match, null, 2) }</pre>`;
      // break;
        case 'O': // 在多行上漂亮地打印对象
        case 'o': // 将对象漂亮地打印在一行上
          match = `<code>${ JSON.stringify(match) }</code>`;
          break;
        case 'c': // 颜色
          match = `${isUseColor ? '</span>' : '' }<span style="${match}">`;
          isUseColor = true;
          break;
        case '%':
          match = '%';
          index -= 1;
          break;
      }
      index += 1;
      return match;
    });
    if (isUseColor) html += '</span>';

    argsList.slice(index).forEach((arg) => {
      html += `<span style="${style}"> ${arg}</span>`;
    });

    $el.insertAdjacentHTML('afterbegin', `<div class="item">${html}</div>`);
  };
}
