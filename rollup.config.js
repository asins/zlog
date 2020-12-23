import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import serve from 'rollup-plugin-serve';

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.js' },
    ],
    plugins: [
      typescript(),
      resolve({ browser: true }),
      commonjs(),
    ],
  },
  {
    input: 'demo/index.ts',
    output: [
      { file: 'demo/demo.js' },
    ],
    plugins: [
      typescript(),
      resolve({ browser: true }),
      commonjs(),
      serve({
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
