import Debug from '../src/index';

// Debug.enable('*');

const debug = Debug('test:debug');

const log = Debug('test:log');

const logger = Debug('logger:debugger');

debug('debug');

log('log');

logger('debugger');
