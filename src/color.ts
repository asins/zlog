export function generateColor(seed: number) {
  seed = (seed % 125) * 5;

  const cb = (item: number, nums: number[]) =>
    nums.reduce((n, num, i) => {
      if (n - num < 3) n = (num + 4) % 16;
      return n;
    }, item % 16);
  const toHex = (num: number) => num.toString(16);

  // 计算三个不同的16进制字符索引
  const rIndex = cb(seed / 25, []); // 第一个字符索引
  const gIndex = cb(seed / 5, [rIndex]); // 第二个字符索引
  const bIndex = cb(seed, [rIndex, gIndex]); // 第三个字符索引

  // 返回最终的颜色字符串，格式为#RRGGBB
  return `#${toHex(rIndex)}${toHex(gIndex)}${toHex(bIndex)}`;
}

// export function createColors() {
//   const colorData =
//     '00f03c03f06c09c09f0c00c90cc30c33f36c36f39c39f3c03c63c93cc3cf60c60f6c390c93c93f9c0c00c06c09c0cc0fc30c36c39c3cc3fc60c63c90c93f00f06f09f0ff30f36f39f3cf3ff60f63f90f93fc3';
//   const matchResult = colorData.match(/\w{3}/g) as string[];
//   return matchResult.map((c) => `#${c}`);
// }

/**
 * 为调试命名空间选择颜色
 */
export function selectColor(namespace: string): string {
  let hash = 0;

  for (let i = 0; i < namespace.length; i++) {
    hash = (hash << 5) - hash + namespace.charCodeAt(i);
    hash |= 0; // 转换为32位整数
  }

  return generateColor(Math.abs(hash));
}
