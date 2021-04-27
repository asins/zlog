import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import serve from 'rollup-plugin-serve';

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
      typescript(),
      resolve({ browser: true }),
      commonjs(),
    ],
  },
  {
    input: 'show2Html.ts',
    output: [
      { file: 'show2Html.js', format: 'es' },
    ],
    plugins: [
      typescript(),
    ],
  },
  {
    input: 'demo/index.ts',
    output: [
      { file: 'demo/demo.js', format: 'umd' },
    ],
    plugins: [
      typescript(),
      resolve({ browser: true }),
      commonjs(),
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
