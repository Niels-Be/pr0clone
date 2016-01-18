const request = require('request');
const async = require('async');
const fs = require('fs');
const path = require('path');
require('./utils.js');
const conf = require('nconf');
conf.use('file', { file: './config.json', format: require('hjson').rt });
conf.argv({
    'D': { 
        alias: 'debug',
        desc: 'Enable Debug mode (verbose)',
        default: false,
        type: 'boolean'
    },
    'd': {
        alias: 'dataDir',
        desc: 'Path to data storage inside the web directory',
        default: '/data',
        type: 'string'
    },
    't': {
        alias: 'topOnly',
        desc: 'Fetch only images on top',
        default: true,
        type: 'boolean'
    },
    'sfw': {
        group: 'Flags:',
        desc: 'Fetch sfw images',
        default: true,
        type: 'boolean'
    },
    'nsfw': {
        group: 'Flags:',
        desc: 'Fetch nsfw images',
        default: true,
        type: 'boolean'
    },
    'nsfl': {
        group: 'Flags:',
        desc: 'Fetch nsfl images',
        default: true,
        type: 'boolean'
    },
    'p': {
        alias: 'parallelDownloads',
        desc: 'Number of parallel downloads',
        default: 2,
        type: 'int'
    },
    'updateInterval': {
        desc: 'Interval in milliseconds the updater looks for new images',
        default: 1 * 60 * 1000,
        type: 'int'
    },
    'retryAfterError': {
        desc: 'Time in milliseconds the updater retries a failed download',
        default: 5 * 1000,
        type: 'int'
    },
    'apiUrl': {
        desc: 'Url to pr0gramms api',
        default: 'http://pr0gramm.com/api/',
        type: 'string'
    },
    'h': {
        alias: 'help',
        desc: 'Displays this help text'
    }
}, 'Usage: $0 <options>');

//conf.stores.file.load((err, data) => { console.log("Loaded:",err,data, conf.get()); });

if (conf.get('debug')) {
    console.log("Config:", conf.get());
}

if (conf.get('help') || conf.get('h')) {
    return conf.stores.argv.showHelp()
}

if (conf.get('save')) {
    return conf.stores.file.save( (err) => { if(err) throw err; console.log('Config stored in '+conf.get('save')); });
}




// Get items
function getItems(url) {
    request(url, (err, res, body) => {
        if(err) {
            console.log('Fetched Error:', err)
            return setTimeout(getItems.bind(null, url), conf.get('retryAfterError'));
        }
        var data = JSON.parse(body);
        console.log('Fetched ' + data.items.length + ' items');
        var q = async.queue((data, callback) => {
            fs.stat(conf.get('dataDir') + '/img/' + data.image, (err, stats) => {
                if(err && err.errno == -2) {
                    async.parallel([
                        download.bind(null, 'thumb', data.thumb),
                        download.bind(null, 'img', data.image)
                    ], callback);  
                } else if(err) {
                    console.log('File Stats Error:', err);
                    callback();
                } else {
                    callback();
                }
            });
        }, conf.get('parallelDownloads'));
        q.push(data.items);
        q.drain = function() { 
            console.log('Done'); 
            setTimeout(getItems.bind(null, url), conf.get('updateInterval'));
        }
    });
}
getItems(conf.get('apiUrl') + 'items/get?flags='+getFlags()+'&promoted='+(conf.get('topOnly') ? 1 : 0));


function getFlags() {
    var res = 0;
    if(conf.get('flags:sfw'))
        res += 1;
    if(conf.get('flags:nsfw'))
        res += 2;
    if(conf.get('flags:nsfl'))
        res += 4;
    return res;
}

function download(type, url, callback) {
    fs.mkdirParent(conf.get('dataDir') + '/' + type + '/'+path.dirname(url), 0o775, (error) => {
        if(error && error.code !== 'EEXIST') throw error;
        console.log("Downloading: "+type+"/"+url);
        var fileStream = fs.createWriteStream(conf.get('dataDir') + '/' + type + '/' + url);
        fileStream.on('finish', () => { console.log("Done: "+type+"/"+url); callback(); });
        request('http://' + type + '.pr0gramm.com/' + url).on('error', (err) => {
            console.log("Download Error: ", err);
            setTimeout(download.bind(null, type, url, callback), conf.get('retryAfterError'));
        }).pipe(fileStream);
    });
}
