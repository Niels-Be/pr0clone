const request = require('request');
const async = require('async');
const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const cache = require('./cache');

exports.start = function (conf) {
	utils.mkdirFast(conf.get('dataDir') + '/items');
	
	setTimeout( getItems.bind(null,
		conf.get('apiUrl') + 'items/get?flags='+utils.getFlags(conf)+'&promoted='+(conf.get('topOnly') ? 1 : 0),
		conf
	), 0);
}


// Get items
function getItems (url, conf) {
    request(url, (err, res, body) => {
        if(err) {
            console.log('Fetch Error:', err)
            return setTimeout(getItems.bind(null, url, conf), conf.get('retryAfterError'));
        }
        try {
            var data = JSON.parse(body);
        } catch(err2) {
            console.log('Error while parsing JSON', err2);
            return setTimeout(getItems.bind(null, url, conf), conf.get('retryAfterError'));
        }
        if (conf.get('debug')) console.log('Fetched ' + data.items.length + ' items');
		
		cache.updateItems(data.items);
		
        var q = async.queue((data, callback) => {
            fs.stat(conf.get('dataDir') + '/img/' + data.image, (err, stats) => {
                if(err && err.errno == -2) {
                    async.parallel([
                        downloadImage.bind(null, conf, 'thumb', data.thumb),
                        downloadImage.bind(null, conf, 'img', data.image),
                        downloadInfo.bind(null, conf, data.id)
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
            if (conf.get('debug')) console.log('Done'); 
            setTimeout(getItems.bind(null, url, conf), conf.get('updateInterval'));
        }
    });
};

function downloadImage(conf, type, url, callback) {
    utils.mkdirFast(conf.get('dataDir') + '/' + type + '/'+path.dirname(url), () => {
        if (conf.get('debug')) console.log("Downloading: "+type+"/"+url);
        var fileStream = fs.createWriteStream(conf.get('dataDir') + '/' + type + '/' + url);
        fileStream.on('finish', () => { 
            if (conf.get('debug')) console.log("Done: "+type+"/"+url); 
            callback(); 
        });
        request('http://' + type + '.pr0gramm.com/' + url).on('error', (err) => {
            console.log("Download Image Error: ", err);
            setTimeout(downloadImage.bind(null, conf, type, url, callback), conf.get('retryAfterError'));
        }).pipe(fileStream);
    });
}

function downloadInfo(conf, id, callback) {
	request(conf.get('apiUrl') + 'items/info?itemId='+id, (err, res, body) => {
		if(err) {
            console.log('Download Info Error:', err)
            return setTimeout(downloadInfo.bind(null, conf, id, callback), conf.get('retryAfterError'));
        }
        try {
            var data = JSON.parse(body);
        } catch(err2) {
            console.log('Error while parsing JSON', err2);
            return setTimeout(downloadInfo.bind(null, conf, id, callback), conf.get('retryAfterError'));
        }
		//Append Cache INFO as Comment
		data.comments.push({
			confidence: 1,
			content: "pr0gramm.com API is unreachable\r\ncomments and tags were loded from cache.\r\nThey may be outdated\r\nLast Update: "+(new Date()).toString(),
			created: Math.floor(Date.now() / 1000),
			down: 0,
			id: -1,
			mark: 8,
			name: "pr0clone",
			parent: 0,
			up: 0
		});
		fs.writeFile(conf.get('dataDir') + '/items/'+ id + '.json', JSON.stringify(data), { mode: 0o644 }, callback);
	});
}
