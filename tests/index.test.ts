import createDebug from '../src/index'

const WindowName = '__ZLOG_COMMON';
const LOCAL_NAME = 'debug';

describe('zlog index', () => {

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('createDebug function', () => {
    console.log = jest.fn();
    const zlog = createDebug('test:a');
    zlog.enabled = true;

    zlog('testc');
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith("%ctest:a +0ms %ctestc %c", "color:#6633CC", "color:inherit", "color:#6633CC");

    // 关闭颜色显示
    jest.resetAllMocks();
    createDebug.canUseColor = false;
    zlog('testb');
    expect(createDebug.canUseColor).toBe(false);
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('test:a +1ms testb ');
  });

  test('createDebug.log function', () => {
    console.log = jest.fn();
    createDebug.log(2, 'test');
    expect(console.log).toHaveBeenCalledWith(2, 'test');
  });

  test('createDebug.enable function', () => {
    createDebug.enable('test:a');
    expect(localStorage.setItem).toHaveBeenCalledWith(LOCAL_NAME, 'test:a');

    createDebug.enable('test:b');
    expect(localStorage.setItem).toHaveBeenCalledWith(LOCAL_NAME, 'test:b');
  });

  test('createDebug.enabled function', async () => {
    createDebug.enable('test:a,debug:*,-debug:c');

    expect(createDebug.enabled('test:')).toBe(false);
    expect(createDebug.enabled('test:a')).toBe(true);
    expect(createDebug.enabled('test:b')).toBe(false);

    expect(createDebug.enabled('debug:a')).toBe(true);
    expect(createDebug.enabled('debug:b')).toBe(true);
    expect(createDebug.enabled('debug:')).toBe(true);
    expect(createDebug.enabled('debug')).toBe(false);
    expect(createDebug.enabled('debug:c')).toBe(false);
  });

  test('createDebug.disable function', async () => {
    createDebug.enable('test:a,debug:*,-debug:c');
    const a = createDebug.disable();
    console.log('disable', a);
    expect(createDebug.enabled('debug:a')).toBe(false);
    expect(createDebug.enabled('debug:*')).toBe(true); // 带*的都返回true
    expect(createDebug.enabled('test:a')).toBe(false);
  });

});
