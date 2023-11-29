import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import serve from 'rollup-plugin-serve';
import html from '@rollup/plugin-html';
// import alias from '@rollup/plugin-alias';
import { swc, defineRollupSwcOption } from 'rollup-plugin-swc3';
// import postcss from 'rollup-plugin-postcss';
import glob from 'tiny-glob/sync.js';
import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';

const curFilePath = fileURLToPath(import.meta.url);
const projectDirPath = path.join(path.dirname(curFilePath), './');
/* eslint-disable no-undef */
const buildEnv = process.env.BUILD_ENV || 'prod';
const EXTENSION = /(\.(umd|cjs|es|m))?\.([cm]?[tj]sx?)$/;
const swcConfig = JSON.parse(readFileSync(`${projectDirPath}/.swcrc`, 'utf-8'));

/** 入口文件路径 */
const entries = [
  'src/index.ts',
  'src/show2Html.ts',
];

console.log(`
  构建目录: ${projectDirPath}
  入口列表: ${entries.join(', ')}
  构建环境：${buildEnv}
`);

const Template_Meta = [
  { charset: 'utf-8' },
  { name: 'format-detection', content: 'telephone=no' },
  { name: 'viewport', content: 'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover' },
];


class RollupConfig {
  static _configs = [];

  static createConfig(entry) {
    const outputPath = entry.replace(/src\//, 'dist/');
    const { _configs } = RollupConfig;
    const config = defineConfig({
      input: entry,
      output: [
        { file: replaceName(outputPath, 'x.esm.js'), format: 'es', sourcemap: buildEnv !== 'prod' },
        { file: replaceName(outputPath, 'x.js'), format: 'cjs', exports: 'named', sourcemap: buildEnv !== 'prod' },
      ],
      plugins: [
        resolve({ browser: true }),
        commonjs(),
        swc(createSwcConfig()),
      ],
    });
    _configs.push(config);

    // create dts config
    const dtsConfig = defineConfig({
      input: entry,
      output: [
        { file: replaceName(outputPath, 'x.d.ts'), format: 'umd' },
      ],
      plugins: [
        resolve(),
        commonjs(),
        dts({
          // respectExternal: true,
          tsconfig: path.resolve(projectDirPath, 'tsconfig.json'),
        }),
      ],
    });
    _configs.push(dtsConfig);
  }

  /**
   * 加入配置
   * @param {RollupOptions | RollupOptions[]} config
   */
  static pushConfig(config) {
    RollupConfig._configs = RollupConfig._configs.concat(config);
  }

  static getConfig() {
    return RollupConfig._configs;
  }
}

export function createSwcConfig() {
  // 非线上环境，关闭压缩
  if (buildEnv !== 'prod') {
    swcConfig.jsc.minify = false;
  }

  // baseUrl必须是绝对地址，无法在`.swcrc`中指定
  swcConfig.jsc.baseUrl = projectDirPath;
  // swcConfig.include = /\.[mc]?[jt]sx?$/; // .mjs .mjsx .cjs .cjsx .js .jsx .ts .tsx
  swcConfig.exclude = /exclude_nothing_npms/;
  swcConfig.tsconfig = false;
  swcConfig.swcrc = false; // 直接给出所有配置，无需再读取`.swcrc`文件

  return defineRollupSwcOption(swcConfig);
}

entries.reduce((res, file) => res.concat(glob(file)), [])
  .forEach((file) => {
    console.log('入口文件 ->', file);
    RollupConfig.createConfig(file);
  });

// 测试
buildEnv !== 'prod' && RollupConfig.pushConfig(defineConfig({
  input: 'demo/index.ts',
  output: [
    { file: 'dist/demo/index.js', format: 'cjs', sourcemap: true },
  ],
  plugins: [
    // postcss({
    //   extract: 'test.css',
    //   use: ['sass'],
    //   extensions: ['.scss', '.css'],
    // }),
    resolve({ browser: true }),
    commonjs(),
    swc(createSwcConfig()),
    html({
      title: 'debug demo',
      publicPath: './',
      fileName: 'index.html',
      attributes: { html: { lang: 'zh-cn' } },
      meta: Template_Meta,
      template: htmlTemplate([
        // { type: 'js', pos: 'after', code: 'document.body.insertAdjacentHTML(\'afterbegin\', \'<textarea style="width:100%;height:30px;"></textarea>\');' },
      ]),
    }),
    serve({
      open: false,
      verbose: true,
      openPage: '/demo/index.html',
      contentBase: ['./dist'],
      host: '127.0.0.1',
      port: 8080,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      onListening(server) {
        const address = server.address();
        const host = address.address === '::' ? 'localhost' : address.address;
        // 通过使用绑定函数，我们可以通过`this`来访问选项
        const protocol = this.https ? 'https' : 'http';
        console.log(`Server listening at ${protocol}://${host}:${address.port}${this.openPage}`);
      },
    }),
  ],
}));

export default RollupConfig.getConfig();

// 处理plugin-html的模板
function htmlTemplate(externals) {
  return ({ attributes, files, meta, publicPath, title }) => {
    let scripts = [...(files.js || [])];
    let links = [...(files.css || [])];

    // externals = [{ type: 'js', file: '//xxxx1.js', pos: 'before' }, { type: 'css', file: '//xxxx1.css' }]
    if (Array.isArray(externals)) {
      const beforeLinks = [];
      const beforeScripts = [];
      externals.forEach((node) => {
        let fileList;
        const isCssFile = node.type === 'css';
        if (node.pos === 'before') {
          fileList = isCssFile ? beforeLinks : beforeScripts;
        } else {
          fileList = isCssFile ? links : scripts;
        }
        fileList.push({ fileName: node.file, code: node.code, attrs: node.attrs });
      });
      scripts = beforeScripts.concat(scripts);
      links = beforeLinks.concat(links);
    }

    scripts = scripts.map(({ fileName, code, attrs }) => {
      attrs = makeHtmlAttributes(Object.assign({}, attributes.script, attrs));
      // console.log('scripts attrs ->', attrs, attributes.script);
      if (fileName) {
        return `<script src="${publicPath}${fileName}"${attrs}></script>`;
      } else if (code) {
        return `<script${attrs}>${code}</script>`;
      } else {
        return '';
      }
    });

    links = links.map(({ fileName, code, attrs }) => {
      attrs = makeHtmlAttributes(Object.assign({}, attributes.link, attrs));
      if (fileName) {
        return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs} />`;
      } else if (code) {
        return `<style rel="stylesheet"${attrs}>${code}</style>`;
      } else {
        return '';
      }
    });

    // console.log('template--->', JSON.stringify(scripts), JSON.stringify(links));

    const metas = meta.map((input) => {
      const attrs = makeHtmlAttributes(input);
      return `<meta${attrs}>`;
    });

    return `<!doctype html>
  <html${makeHtmlAttributes(attributes.html)}>
    <head>
      ${metas.join('\n')}
      <title>${title}</title>
      ${links.join('\n')}
    </head>
    <body>
    <script>
    // if (location.search.indexOf('&devtool=true')) {
    //   var script = document.createElement('script');
    //   script.src="//g.alicdn.com/code/lib/eruda/2.4.1/eruda.min.js";
    //   document.body.appendChild(script);
    //   script.onload = function () { eruda.init() }
    // }
    </script>
      ${scripts.join('\n')}
    </body>
  </html>`;
  };
}

function makeHtmlAttributes(attributes) {
  if (!attributes) {
    return '';
  }

  const keys = Object.keys(attributes);
  // eslint-disable-next-line no-return-assign
  return keys.reduce((result, key) => (result += ` ${key}="${attributes[key]}"`), '');
}

function replaceName(entry, name) {
  const exist = name.replace(/^[^.]+/, '');
  const filename = path.basename(entry).replace(EXTENSION, '');
  return path.resolve(
    path.dirname(entry),
    filename + exist,
  );
}
