const request = require('request');
const async = require('async');
const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const cache = require('./cache');

exports.start = function (conf) {
	
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
            cache.getInfo(data.id, (err, info) => {
                if(err) {
                    console.log('Error while getting info from cache',err);
                    return callback(err);
                } else if(info) //Already exsist
                    return callback();

                async.parallel([
                    downloadImage.bind(null, conf, 'thumb', data.thumb),
                    downloadImage.bind(null, conf, 'img', data.image),
                    downloadInfo.bind(null, conf, data.id)
                ], callback);  
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
        
        cache.updateInfo(id, data);
        callback();
	});
}
