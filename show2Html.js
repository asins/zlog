const INSERT_POSITION_AFTER_BEGIN = "afterbegin";
const INSERT_POSITION_BEFORE_END = "beforeend";
function show2Html(Debug, options = {}) {
  const dockSideList = ["mini", "bottom", "all"];
  const $el = document.createElement("div");
  let curdockSideIndex = dockSideList.indexOf(options.dock);
  if (curdockSideIndex < 0)
    curdockSideIndex = 0;
  const className = options.cls || `zlog-${Math.trunc(Math.random() * Date.now()).toString(32)}`;
  $el.classList.add(className);
  $el.classList.add(dockSideList[curdockSideIndex]);
  $el.insertAdjacentHTML("afterbegin", `<style>
  .${className}{position:fixed;background:rgba(0,0,0,.6);color:white;font-size:12px;z-index:99999}
  .${className}.bottom{width:100%;bottom:0;left:0;}
  .${className}.bottom .logs{height:50vh;}
  .${className}.all{width:100%;height:100%;top:0;left:0}
  .${className}.mini{width:0;height:0;}
  .${className}.mini .t-${className} .logo{position:fixed;bottom:5px;right:5px}
  .${className}.mini .logs,
  .${className}.mini .filter{display:none}
  .${className} .t-${className}{position:absolute;width:100%;display:flex;align-items:center;justify-content:flex-end;background:rgba(0,0,0,.6)}
  .${className} .t-${className} .logo{flex:none;user-select:none;width:22px;height:22px;line-height:22px;font-size:18px;display:inline-block;text-align:center;background:rgba(0,0,0,.8);border-radius:5px;cursor:pointer}
  .${className} .t-${className} .filter{margin:0 6px;flex:auto;overflow:auto;white-space:nowrap}
  .${className} .t-${className} .filter .item{margin-right:3px;line-height:18px;padding:2px 4px;display:inline-block;cursor:pointer}
  .${className} .t-${className} .filter .select{background:#000;position:relative}
  .${className} .t-${className} .filter .select:before{content:"";position:absolute;width:0;height:0;top:0;left:0;border: 3px solid red;border-bottom-color:transparent;border-right-color:transparent;}
  .${className} .logs{padding:28px 10px 6px;overflow:auto;height:100%;box-sizing:border-box}
  .${className} .logs.disable .item{display:none}
  </style>
  <div class="t-${className}"><div class="filter"></div><div class="logo">Z</div></div>
  <div class="logs"></div>`);
  (options.container || document.body).appendChild($el);
  const $style = $el.querySelector("style");
  const $logs = $el.querySelector(".logs");
  const $icon = $el.querySelector(`.t-${className} .logo`);
  $icon.addEventListener("click", (e) => {
    $el.classList.remove(dockSideList[curdockSideIndex]);
    curdockSideIndex = (curdockSideIndex + 1) % dockSideList.length;
    $el.classList.add(dockSideList[curdockSideIndex]);
  });
  const filters = {};
  let selectNum = 0;
  const $filters = $el.querySelector(".filter");
  $filters.addEventListener("click", (e) => {
    const $item = e.target;
    const name = $item.getAttribute("data-name");
    const isSelect = !filters[name];
    filters[name] = isSelect;
    const htmlAttrName = getClassName(name);
    if (isSelect) {
      selectNum += 1;
      $logs.setAttribute(htmlAttrName, "true");
      $logs.classList.add("disable");
      $item.classList.add("select");
    } else {
      selectNum -= 1;
      $logs.removeAttribute(htmlAttrName);
      $item.classList.remove("select");
      if (selectNum < 1) {
        selectNum = 0;
        $logs.classList.remove("disable");
      }
    }
  });
  Debug.log = (...args) => {
    const argsList = args.slice(1);
    let isUseColor = false;
    let index = 0;
    let style = "";
    let html = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
      match = argsList[index];
      if (index === 1)
        style = match;
      switch (format) {
        case "O":
        case "o":
          match = `<code>${JSON.stringify(match)}</code>`;
          break;
        case "c":
          match = `${isUseColor ? "</span>" : ""}<span style="${match}">`;
          isUseColor = true;
          break;
        case "%":
          match = "%";
          index -= 1;
          break;
      }
      index += 1;
      return match;
    });
    if (isUseColor)
      html += "</span>";
    argsList.slice(index).forEach((arg) => {
      html += `<span style="${style}"> ${typeof arg === "object" ? JSON.stringify(arg) : arg}</span>`;
    });
    const log = /^(%c)?([^ %]+)/.exec(args[0]);
    const name = log[2];
    updateFilterList(name, log && log[1] && args[1]);
    $logs.insertAdjacentHTML(options.insertPosition === INSERT_POSITION_AFTER_BEGIN ? INSERT_POSITION_AFTER_BEGIN : INSERT_POSITION_BEFORE_END, `<div class="item" data-name="${name}">${html}</div>`);
  };
  function updateFilterList(name, color) {
    if (name && !Object.prototype.hasOwnProperty.call(filters, name)) {
      filters[name] = false;
      $style.innerText += `.${className} .logs[${getClassName(name)}="true"] .item[data-name="${name}"]{display:block}`;
      $filters.insertAdjacentHTML("beforeend", `<span class="item" data-name="${name}" ${color ? `style="${color}"` : ""}>${name}</span>`);
    }
  }
  return $el;
}
function getClassName(str) {
  return str.replace(/[^a-z0-9-]/ig, "-");
}

export { INSERT_POSITION_AFTER_BEGIN, INSERT_POSITION_BEFORE_END, show2Html as default };
