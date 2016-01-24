const utils = require('./lib/utils');
const downloader = require('./lib/downloader');
const cache = require('./lib/cache');
const api = require('./lib/api');


const conf = utils.parseArgs();

cache.init(conf);
downloader.start(conf);
api.start(conf);

console.log('Updater Started');




