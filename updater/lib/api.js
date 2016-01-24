const express = require('express');
const httpProxy = require('http-proxy');
const cache = require('./cache');

exports.start = function (conf) {

	var app = express();
	var api = express.Router();

	var proxy = httpProxy.createProxyServer();
	var serverLocaly = false;

	var resetTaskId;
	proxy.on('error', (err, req, res) => {
		serverLocaly = true;
		clearTimeout(resetTaskId);
		resetTaskId = setTimeout(() => { serverLocaly = false; }, conf.get('proxyBackoff'));
	});

	api.use('/items/get', (req, res, next) => {
		//Use this helper function as proxy fallback
		function serverLocal() {
			cache.getItems(req.query.id, (err, items) => {
				if(err) {
					console.log('Error in getItems', err);
					return res.status(503).end();
				}
				res.send({
					atEnd: items.atEnd,
					atStart: items.atStart,
					cache: "stream:top:3" + ( req.query.id ? ':'+req.query.id : ''),
					error: null,
					items: items.items,
					qc: 0,
					rt: 0,
					ts: Math.floor(Date.now() / 1000)
				});
			});
		}
		if(serverLocaly) {
			serverLocal();
		} else {
			//Otherwise use proxy
			proxy.web(req, res, { 
				target: 'http://pr0gramm.com'
			}, serverLocal);
		}
	});
	api.use('/items/info', (req, res, next) => {
		//Use this helper function as proxy fallback
		function serverLocal() {
			res.setHeader('Content-Type', 'text/plain; Charset=UTF-8');
			res.sendFile(conf.get('dataDir') + '/items/'+req.query.itemId+'.json', (err) => {
				console.log('Item info does not exsist', err);
				//Send fallback message
				res.send({
					tags: [
						{ id: 0,confidence: 1,tag: "API Unreachable" },
						{ id: 0,confidence: 0.9,tag: "No Tags in cache" }
					],
					comments: [
						{ id: 0,parent: 0,content: "pr0gramm.com API is unreachable\r\nand no comments were found in cache",created: Math.floor(Date.now() / 1000),up: 0,down: 0,confidence: 1,name: "pr0clone",mark: 8 },
					],
					ts: Math.floor(Date.now() / 1000),
					cache: "item:"+req.query.itemId,
					rt: 0,
					qc: 0
				});
			});
		}
		
		if(serverLocaly) {
			serverLocal();
		} else {
			//Otherwise use proxy
			proxy.web(req, res, { 
				target: 'http://pr0gramm.com'
			}, serverLocal);
		}
	});
	api.use('*', (req, res, next) => {
		proxy.web(req, res, { 
			target: 'http://pr0gramm.com'
		});
	});


	app.use('/api', api);
	app.use('/data', express.static(conf.get('dataDir')));
	app.get('/data/:type/*', (req, res, next) => {
		console.log("Image does not exsist; using proxy", req.params);
		proxy.web(req, res, { 
			target: 'http://'+req.params.type+'.pr0gramm.com',
			forward: '/'+req.params[0]
		});
	});
	app.use('/', express.static(conf.get('publicDir')));
	app.get('*', (req, res, next) => {
		res.sendfile(conf.get('publicDir') + '/index.html');
	});
	
	app.listen(conf.get('webPort'), conf.get('bindAddress'));
};
