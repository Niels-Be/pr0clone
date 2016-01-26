const Datastore = require('nedb');
const utils = require('./utils');

var db = {};
exports.init = function(conf) {
	db.items = new Datastore({ filename: conf.get('dataDir') + '/items.db', autoload: true });
	db.info = new Datastore({ filename: conf.get('dataDir') + '/info.db', autoload: true });
	
    if(parseInt(conf.get('keepImagePeriod')) > 0)
    	setInterval(cleanup.bind(null, conf), 1 * 60 * 60 * 1000); //Do cleanup every hour
};

exports.getItems = function(id, promoted, flags, callback) {
    id = parseInt(id);
    flags = utils.fromFlags(flags);
	if(promoted) {
		if(! id || id == 0) {
			db.items.find({ promoted: { $gt: 0 }, flags: { $in: flags }}, { _id: 0 }).sort({ promoted: 1 }).limit(126).exec((err, docs) => {
				if(err)	return callback(err);
				callback(null, {
					atEnd: docs.length < 126,
					atStart: true,
					items: docs
				});
			});
		} else {
			db.items.findOne({ _id: id }, (err, doc) => {
				if(err || doc == null)
					return callback(err || 'Document '+id+' not found');
				db.items.find( { $and: [{ promoted: { $lte: doc.promoted }}, { promoted: { $gt: doc.promoted - 131 }}], flags: { $in: flags }}, { _id: 0 }, (err, docs) => {
					if(err)	return callback(err);
					db.items.find( { $and: [{ promoted: { $gt: doc.promoted }}, { promoted: { $lt: doc.promoted + 128 }}], flags: { $in: flags }}, { _id: 0 }, (err, docs2) => {
						if(err)	return callback(err);
						callback(null, {
							atEnd: docs.length < 130,
							atStart: docs2.length < 126,
							items: docs.concat(docs2)
						});
					});
				});
			});
		}
	} else {
		if(! id || id == 0) {
			db.items.find({ flags: { $in: flags } }, { _id: 0 }).sort({ _id: 1 }).limit(126).exec((err, docs) => {
				if(err)	return callback(err);
				callback(null, {
					atEnd: docs.length < 126,
					atStart: true,
					items: docs
				});
			});
		} else {
			db.items.find( { $and: [{ _id: { $lte: id }}, { _id: { $gt: id - 131 }}], flags: { $in: flags }}, (err, docs) => {
				if(err)	return callback(err);
				db.items.find( { $and: [{ _id: { $gt: id }}, { _id: { $lt: id + 128 }}], flags: { $in: flags }}, (err, docs2) => {
					if(err)	return callback(err);
					callback(null, {
						atEnd: docs.length < 130,
						atStart: docs2.length < 126,
						items: docs.concat(docs2)
					});
				});
			});
		}
	}
};

exports.updateItems = function(items) {
	//rename id field
	for(var i = 0; i < items.length; i++) {
		items[i]._id = items[i].id;
		db.items.update({ _id: items[i].id } , items[i], { upsert: true }, (err) => {
			if(err) console.log('Error Cache update Items', err);
		});
	}
	
};

exports.getInfo = function(id, callback) {
    id = parseInt(id);
    db.info.findOne({ _id: id }, callback);
};

exports.updateInfo = function(id, info) {
    id = parseInt(id);
    info._id = id;
    db.info.update({ _id: id }, info, { upsert: true }, (err)  => {
        if(err) console.log('Error Cache update Info', err);
    });
};

function cleanup(conf) {
    var then = new Date();
    then.setDate(then.getDate() - conf.get('keepImagePeriod'));
    then = Math.floor(then.getTime()/1000);

    db.items.find({ created: { $lt: then } }, (err, docs) => {
        for(var i = 0; i < docs.length; i++) {
            conf.get('debug') && console.log('Cleaning', docs[i].id);
            fs.unlink(conf.get('dataDir')+'/img/'+docs[i].image);
            fs.unlink(conf.get('dataDir')+'/thumb/'+docs[i].thumb);
            if(!conf.get('keepMetadata')) {
                //fs.unlink(conf.get('dataDir')+'/items/'+docs[i].id);
                db.info.remove({ _id: docs[i].id }, (err, num) => {
                    if(err) console.log('Error in cleanup info', err);
                });
                db.items.remove({ _id: docs[i].id }, (err, num) => {
                    if(err) console.log('Error in cleanup items', err);
                });
            }
        }
    });
    //TODO delete empty folders
}


function startCleanup_old(conf) {
    var then = new Date(); 
    then.setDate(then.getDate() - conf.get('keepImagePeriod'));
    fs.readdir(conf.get('dataDir')+'/img', (err, years) => {
        for(var i = 0; i < years.length; i++) {
            var year = parseInt(years[i]);
            if(isNaN(year)) continue;
            fs.readdir(conf.get('dataDir')+'/img/'+years[i], (err, months) => {
                if(err) return console.log('Error in cleanup', err);
                if(months.length == 0)
                    fs.rmdir(conf.get('dataDir')+'/img/'+years[i]);
                for(var j = 0; j < months.length; j++) {
                    var month = parseInt(months[j]);
                    if(isNaN(month)) continue;
                    fs.readdir(conf.get('dataDir')+'/img/'+years[i]+'/'+months[j], (err, days) => {
                        if(err) return console.log('Error in cleanup', err);
                        if(days.length == 0)
                            fs.rmdir(conf.get('dataDir')+'/img/'+years[i]+'/'+months[j]);
                        for(var k = 0; k < days.length; k++) {
                            var day = parseInt(days[j]);
                            if(isNaN(day)) continue;
                            if((new Date(year, month - 1, day)) < then) {
                                fs.readdir(conf.get('dataDir')+'/img/'+years[i]+'/'+months[j]+'/'+days[k], (err, files) => {
                                    if(err) return console.log('Error in cleanup', err);
                                    if(files.length == 0)
                                        fs.rmdir(conf.get('dataDir')+'/img/'+years[i]+'/'+months[j]+'/'+days[k]);
                                    for(var l = 0; l < files.length; l++)
                                        fs.unlink(conf.get('dataDir')+'/img/'+years[i]+'/'+months[j]+'/'+days[k]+'/'+files[l]);
                                });
                            }
                        }
                    });
                }
            });
        }
    });
}
