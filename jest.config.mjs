import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const curFilePath = fileURLToPath(import.meta.url);
const projectDirPath = path.join(path.dirname(curFilePath), './');
const swcConfig = JSON.parse(readFileSync(`${projectDirPath}/.swcrc`, 'utf-8'));
swcConfig.module = {
  type: 'commonjs',
  strict: true,
  noInterop: true,
};
// baseUrl必须是绝对地址，无法在`.swcrc`中指定
swcConfig.jsc.baseUrl = projectDirPath;

export default {
  displayName: 'jsdom',
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['js', 'json', 'ts'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  rootDir: './',
  testRegex: '.*\\.test\\.ts$',
  collectCoverageFrom: [
    './src/**/*.(t|j)s',
  ],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', swcConfig],
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*(@ali|crypto-es|nanoid)/)',
  ],
  coveragePathIgnorePatterns: [
  ],
  setupFiles: [
    'jest-localstorage-mock',
  ],
  coverageProvider: 'v8',
  coverageDirectory: './.ci/',
  coverageReporters: [
    'json', 'html', 'clover', 'lcov', 'text',
  ],
};
