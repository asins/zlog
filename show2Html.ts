
// 是否将日志显示在网页中
export default function show2Html(Debug, cls?: string) {
  const $el = document.createElement('div');
  const dockSideList = ['bottom', 'all', 'mini'];
  let curdockSideIndex = 0;
  const className = cls || `zlog-${Math.trunc(Math.random() * Date.now()).toString(32)}`;
  $el.classList.add(className);
  $el.classList.add(dockSideList[curdockSideIndex]);
  $el.insertAdjacentHTML('afterbegin', `<style>
  .${className}{position:fixed;background:rgba(0,0,0,.6);color:white;font-size:12px;z-index:99999}
  .${className}.bottom{width:100%;bottom:0;left:0;}
  .${className}.bottom .logs{height:50vh;}
  .${className}.all{width:100%;height:100%;top:0;left:0}
  .${className}.mini{width:0;height:0;}
  .${className}.mini .tools-${className} .logo{position:fixed;bottom:5px;right:5px}
  .${className} .tools-${className}{position:absolute;width:100%;display:flex;align-items:center;justify-content:flex-end;background:rgba(0,0,0,.6)}
  .${className} .tools-${className} .logo{flex:none;user-select:none;width:16px;height:16px;line-height:16px;font-size:16px;display:inline-block;text-align:center;border:1px solid rgba(0,0,0,.8);background:rgba(0,0,0,.8);border-radius:5px;overflow:hidden;cursor:pointer}
  .${className} .tools-${className} .filter{margin:0 6px;flex:auto;overflow:auto;white-space:nowrap}
  .${className} .tools-${className} .filter .item{margin-right:3px;line-height:18px;padding:2px 4px;display:inline-block;cursor:pointer}
  .${className} .tools-${className} .filter .select{background:#000;position:relative}
  .${className} .tools-${className} .filter .select:before{content:"";position:absolute;width:0;height:0;top:0;left:0;border: 3px solid red;border-bottom-color:transparent;border-right-color:transparent;}
  .${className} .logs{padding:28px 10px 6px;overflow:auto;height:100%;box-sizing:border-box}
  .${className} .logs.disable .item{display:none}
  </style>
  <div class="tools-${className}"><div class="filter"></div><div class="logo">Z</div></div>
  <div class="logs"></div>`);
  document.body.appendChild($el);
  const $style = $el.querySelector('style');
  const $logs = $el.querySelector('.logs');

  const $icon = $el.querySelector(`.tools-${className} .logo`);
  $icon.addEventListener('click', (e) => {
    $el.classList.remove(dockSideList[curdockSideIndex]);
    curdockSideIndex = (curdockSideIndex + 1) % dockSideList.length;
    $el.classList.add(dockSideList[curdockSideIndex]);
  });

  const filters = {};
  let selectNum = 0;
  const $filters = $el.querySelector('.filter');
  $filters.addEventListener('click', (e) => {
    const $item = e.target as HTMLElement;
    const name = $item.getAttribute('data-name');
    const isSelect = !filters[name];
    filters[name] = isSelect;

    const htmlAttrName = getClassName(name);
    if (isSelect) {
      selectNum += 1;
      $logs.setAttribute(htmlAttrName, 'true');
      $logs.classList.add('disable');
      $item.classList.add('select');
    } else {
      selectNum -= 1;
      $logs.removeAttribute(htmlAttrName);
      $item.classList.remove('select');
      if (selectNum < 1) { // 无主动过虑项
        selectNum = 0;
        $logs.classList.remove('disable');
      }
    }
    // console.log($item, name);
  });

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
      html += `<span style="${style}"> ${typeof arg === 'object' ? JSON.stringify(arg) : arg}</span>`;
    });

    const log = /^(%c)?([^ %]+)/.exec(args[0]);
    const name = log[2];
    updateFilterList(name, log && log[1] && args[1]);
    $logs.insertAdjacentHTML('beforeend', `<div class="item" data-name="${name}">${html}</div>`);
  };

  function updateFilterList(name, color) {
    if (name && !Object.prototype.hasOwnProperty.call(filters, name)) {
      filters[name] = false;
      $style.innerText += `.${className} .logs[${getClassName(name)}="true"] .item[data-name="${name}"]{display:block} `;
      $filters.insertAdjacentHTML('beforeend', `<span class="item" data-name="${name}"${color ? ` style="${color}"` : ''}>${name}</span>`);
    }
  }

  return $el;
}

// css 属性选择器对字符有要求
// 将非字母、数字、-之外的字符替换为-
function getClassName(str) {
  return str.replace(/[^a-z0-9-]/ig, '-');
}
