import Debug from '../index';
import show2Html, { INSERT_POSITION_BEFORE_END } from '../show2Html';
import queryString from 'query-string';

const pageUrlParams = queryString.parse(window.location.search, {
  parseNumbers: true,
  parseBooleans: true,
});
const $logs = show2Html(Debug, {
  insertPosition: 'afterbegin',
});

// 设置日志显示规则
Debug.enable('*, -name:input');

// 测试排除特定日志
const logInput = Debug('name:input');
const logOutput = Debug('name:output');
const logClose = Debug('name:close');
logInput('logInput日志namespace不允许输出，此日志未能输出'); // 当前namespace中不会显示
logOutput('logOutput日志namespace不允许输出，此日志未能输出');
logClose('logClose日志namespace可见');

// 测试日志字符中的输出格式
const debugTestFormatters = Debug('test:format');
const obj = { a: 'tedt', b: 123, c: [1, 2, 'test'] };
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
debugTestFormatters('测试格式化字符规则:');
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
setTimeout(() => {
  logInput.enabled = true; // 单独针对logInput模式开启日志显示
  console.log('通过namespace查询日志模式是否显示(不支持通配符)', Debug.enabled('name:output'));
  logInput('namespace enabled设置为true后，日志可见了，test input timeout');
  logOutput('test output timeout');
  logClose.enabled = false; // 关闭logClose日志输出
  logClose('此日志不可见');
}, 1000);

if (pageUrlParams && pageUrlParams.DEBUG === 1) {
  setTimeout(() => {
    $logs.querySelector('.logs').insertAdjacentHTML(INSERT_POSITION_BEFORE_END, '<div class="item">输出所有命令空间的日志:</div>');
    Debug.enable('*');
    Debug.canUseColor = false;

    const logKeyDown = Debug('keyboard:down');
    document.body.addEventListener('keydown', (e) => {
      console.log('keydown', e.code);
      logKeyDown('keyCode=%i, code=%s', e.keyCode, e.code);
    });
    const logKeyUp = Debug('keyboard:up');
    document.body.addEventListener('keyup', (e) => {
      logKeyUp('keyCode=%i, code=%s', e.keyCode, e.code);
    });
  }, 2000);
}
