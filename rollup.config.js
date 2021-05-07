import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import serve from 'rollup-plugin-serve';
import esbuild from 'rollup-plugin-esbuild';

const rollupEnv = process.env.ROLLUP_ENV;
console.log('rollup env:', rollupEnv);

export default [
  {
    input: 'index.ts',
    output: [
      { file: 'index.js' },
      { file: 'index.esm.js', format: 'es' },
    ],
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      esbuild({
        include: /\.[jt]sx?$/,
        minify: false,
        target: 'esnext',
      }),
    ],
  },
  {
    input: 'show2Html.ts',
    output: [
      { file: 'show2Html.js', format: 'es' },
    ],
    plugins: [
      esbuild({
        include: /\.[jt]sx?$/,
        minify: false,
        target: 'esnext',
      }),
    ],
  },
  {
    input: 'demo/index.ts',
    output: [
      { file: 'demo/demo.js', format: 'umd' },
    ],
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      esbuild({
        include: /\.[jt]sx?$/,
        minify: false,
        target: 'esnext',
      }),
      rollupEnv !== 'prod' && serve({
        open: false,
        openPage: 'index.html',
        contentBase: ['./demo'],
        host: '0.0.0.0',
        port: 7001,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }),
    ],
  },
];
