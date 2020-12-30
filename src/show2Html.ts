
// 是否将日志显示在网页中
export default function show2Html(Debug, cls?: string) {
  const $el = document.createElement('div');
  $el.setAttribute('class', cls || 'debug-container');
  document.body.appendChild($el);
  Debug.log = (...args) => {
    console.log('log-->', args);
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

    $el.insertAdjacentHTML('beforeend', `<div class="item">${html}</div>`);
  };
  return $el;
}
