const oneSecond = 1000;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;

/**
 * 为毫秒时间加上单位
 * @param {Number} ms 毫秒
 */
export function humanize(ms: number) {
  let suff = 'ms';
  if (ms >= oneHour) {
    ms /= oneHour;
    suff = 'h';
  } else if (ms >= oneMinute) {
    ms /= oneMinute;
    suff = 'm';
  } else if (ms >= oneSecond) {
    ms /= oneSecond;
    suff = 's';
  }
  return `${Math.round(ms * 10) / 10}${suff}`;
}
