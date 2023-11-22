import { save, load, selectColor } from '../src/common';

const LOCAL_NAME = 'debug';

describe('zlog common', () => {

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  afterEach(() => {
    jest.useRealTimers();
  });


  test('common save function', async () => {
    save('test');

    // 检测
    expect(localStorage.setItem).toHaveBeenLastCalledWith(LOCAL_NAME, 'test');
    expect(localStorage.__STORE__[LOCAL_NAME]).toBe('test');
  });

  test('common load function', async () => {
    save('test2');

    const data = load();

    // 检测
    expect(localStorage.getItem).toHaveBeenLastCalledWith(LOCAL_NAME);
    expect(data).toBe('test2');
  });

  test('common selectColor function', async () => {
    const color = selectColor('test');
    const color2 = selectColor('test');

    // 检测
    expect(color).toBe('#33FFCC');
    expect(color2).toBe('#33FFCC'); // 相同名称返回相同颜色

    const color3 = selectColor('test2');
    const color4 = selectColor('2test');
    expect(color3).toBe('#0033CC');
    expect(color4).toBe('#CC3399');
  });
});
