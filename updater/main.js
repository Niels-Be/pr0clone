const request = require('request');
const async = require('async');
const fs = require('fs');
const path = require('path');
require('./utils.js');

// CONFIG PARAMS
const apiUrl = 'http://pr0gramm.com/api/'; 

const topOnly = true;
const flags = {
    sfw: true,
    nsfw: true,
    nsfl: false
};
const parallelDownloads = 1;
const dataDir = '/home/niels/pr0clone/public/data';

// Get items
request(apiUrl + 'items/get?flags='+getFlags(flags)+'&promoted='+(topOnly ? 1 : 0), (err, res, body) => {
    var data = JSON.parse(body);
    console.log('Fetched ' + data.items.length + ' items');
    var q = async.queue((data, callback) => {
        fs.stat(dataDir + '/img/' + data.image, (err, stats) => {
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
    }, parallelDownloads);
    q.push(data.items);
    q.drain = function() { console.log('Done'); }
});

function getFlags(flags) {
    var res = 0;
    if(flags.sfw)
        res += 1;
    if(flags.nsfw)
        res += 2;
    if(flags.nsfl)
        res += 4;
    return res;
}

function download(type, url, callback) {
    fs.mkdirParent(dataDir + '/' + type + '/'+path.dirname(url), 0o775, () => {
        console.log("Downloading: "+type+"/"+url);
        var fileStream = fs.createWriteStream(dataDir + '/' + type + '/' + url);
        fileStream.on('finish', () => { console.log("Done: "+type+"/"+url); callback(); });
        request('http://' + type + '.pr0gramm.com/' + url).pipe(fileStream);
    });
}
