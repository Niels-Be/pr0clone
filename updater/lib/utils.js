var fs = require('fs');
var path = require('path');
const conf = require('nconf');
 
fs.mkdirParent = function(dirPath, mode, callback) {
  //Call the standard fs.mkdir
  fs.mkdir(dirPath, mode, function(error) {
    //When it fail in this way, do the custom steps
    if (error && error.errno === -2) {
      //Create all the parents recursively
      fs.mkdirParent(path.dirname(dirPath), mode, () => {
        //And then the directory
        fs.mkdir(dirPath, mode, callback);
      });
    } else {
        //Manually run the callback since we used our own callback to do all these
        callback && callback(error);   
    }
  });
};

var folderCache = [];
exports.mkdirFast = function(dirPath, callback) {
	if(folderCache.indexOf(dirPath) === -1) {
		//Not in cache create it
		fs.mkdirParent(dirPath, 0o755, (error) => {
			if(error && error.code !== 'EEXIST') throw error;
			folderCache.push(dirPath);
			callback && callback();
		});
	} else {
		//We know it already exsists
		callback && callback();
	}
}

exports.parseArgs = function() {
	conf.use('file', { file: './config.json', format: require('hjson').rt });
	conf.argv({
		'D': { 
			alias: 'debug',
			desc: 'Enable Debug mode (verbose)',
			default: false,
			type: 'boolean'
		},
		'p': {
			alias: 'webPort',
			desc: 'Port for the WebServer',
			default: 3000,
			type: 'int'
		},
		'b': {
			alias: 'bindAddress',
			desc: 'Address for the WebServer to bind on',
			default: '0.0.0.0',
			type: 'string'
		},
		'dataDir': {
			desc: 'Path to data storage',
			default: '/data',
			type: 'string'
		},
		'publicDir': {
			desc: 'Path to static web content',
			default: '/public',
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
		'parallelDownloads': {
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
		'proxyBackoff': {
			desc: 'Time in milliseconds the web server serves API requests localy after a proxy request failed',
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
		conf.stores.argv.showHelp();
		process.exit();
	}

	return conf;
};

 exports.getFlags = function(conf) {
    var res = 0;
    if(conf.get('sfw'))
        res += 1;
    if(conf.get('nsfw'))
        res += 2;
    if(conf.get('nsfl'))
        res += 4;
    return res;
}
