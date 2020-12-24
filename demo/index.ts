import Debug from '../src/index';
import show2Html from '../src/show2Html';

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
