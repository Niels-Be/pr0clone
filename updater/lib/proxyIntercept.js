var zlib = require('zlib');


//Usage proxyIntercept(httpProxyServer [, urlFilterRegex], callback(req, res, data) )
module.exports = function(proxy, urlFilter, callback) {
    if(!proxy || ( !urlFilter && !callback)) throw new Error('Invalid Arguments');
    if(!callback) {
        callback = urlFilter;
        urlFilter = null;
    }

    proxy.on('proxyRes', function (proxyRes, req, res) {
        if(urlFilter && !proxyRes.req.path.match(urlFilter)) return;
        var _write = res.write;
        var _end = res.end;

        var gz = zlib.Gunzip();

        res.isGziped = false;
        var enc = proxyRes.headers['content-encoding'];
        if(enc && enc.toLowerCase() == 'gzip')
            res.isGziped = true;

        var body = '';
        res.write = function(data) {
            if (res.isGziped)
                gz.write(data);
            else
                body += data;

            _write.apply(res, arguments);
        };
        res.end = function() {
            if(res.isGziped)
                gz.end();
            else
                callback(req, res, body);
            _end.apply(res, arguments);
        };
        gz.on('data', (data) => { body += data; });
        gz.on('end', () => { callback(req, res, body); });
    });
};

