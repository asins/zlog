import Debug from '../index';
import show2Html from '../show2Html';
import queryString from 'query-string';

const pageUrlParams = queryString.parse(window.location.search, {
  parseNumbers: true,
  parseBooleans: true,
});
show2Html(Debug);

// 设置日志显示规则
Debug.enable('*, -name:input');

// 测试排除特定日志
const logInput = Debug('name:input');
const logOutput = Debug('name:output');
logInput('test input'); // 当前namespace中不会显示
logOutput('test output');

// 测试日志字符中的输出格式
const debugTestFormatters = Debug('test:format');
const obj = { a: 'tedt', b: 123, c: [1, 2, 'test'] };
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('对象漂亮的多行显示:%O', obj);
debugTestFormatters('对象漂亮的显示在一行中:%o', obj);
debugTestFormatters('显示字符串: %o', '这是一个字符串变量的内容');
debugTestFormatters('整数和浮点数显示: %d, %f', 123, 3.1415926);
debugTestFormatters('百分号不占用参数位: %%, test', 234, 'test');
debugTestFormatters('不支持的参数位情况: %t, tt-%x-tt', 234, 'test');

// 测试禁用日志颜色
const testNoColor = Debug('logger:debugger', false);
testNoColor('测试不使用颜色: %s', '此内容无特殊颜色');

// 测试日志间隔时间
logInput('logInput日志模式是否允许显示:', logInput.enabled);
setTimeout(() => {
  logInput.enabled = true; // 单独针对logInput模式开启日志显示
  console.log('通过namespace查询日志模式是否显示(不支持通配符)', Debug.enabled('name:output'));
  logInput('test input timeout');
  logOutput('test output timeout');
}, 100);

setTimeout(() => {
// 对所有日志模式设置显示规则
  Debug.enable((pageUrlParams && pageUrlParams.DEBUG === 1) ? '*' : String(pageUrlParams.DEBUG || ''));

  const logKeyDown = Debug('keyboard:down');
  document.addEventListener('keydown', (e) => {
    logKeyDown('keyCode=%i, code=%s', e.keyCode, e.code);
  });
  const logKeyUp = Debug('keyboard:up');
  document.addEventListener('keyup', (e) => {
    logKeyUp('keyCode=%i, code=%s', e.keyCode, e.code);
  });
}, 1000);
