import Debug from '../src/index';

Debug.enable('test:*');

const debug = Debug('test:debug');

const log = Debug('test:log');

debug('debug');

log('log');
