var Datastore = require('nedb');

var db = {};
exports.init = function(conf) {
	db.items = new Datastore({ filename: conf.get('dataDir') + '/items.db', autoload: true });
	db.info = new Datastore({ filename: conf.get('dataDir') + '/info.db', autoload: true });
	
	startCleanup(conf);
};

exports.getItems = function(id, promoted, callback) {
	if(promoted) {
		if(! id || id == 0) {
			db.items.find({ promoted: { $gt: 0 }}, { _id: 0 }).sort({ promoted: 1 }).limit(126).exec((err, docs) => {
				if(err)	callback(err);
				callback(null, {
					atEnd: docs.length < 126,
					atStart: true,
					items: docs
				});
			});
		} else {
			db.items.findOne({ _id: id }, (err, doc) => {
				if(err || doc == null)
					callback(err || 'Document not found');
				db.items.find( { $and: [{ promoted: { $lte: doc.promoted }}, { promoted: { $gt: doc.promoted - 131 }}]}, { _id: 0 }, (err, docs) => {
					if(err)	callback(err);
					db.items.find( { $and: [{ promoted: { $gt: doc.promoted }}, { promoted: { $lt: doc.promoted + 128 }}]}, { _id: 0 }, (err, docs2) => {
						if(err)	callback(err);
						callback(null, {
							atEnd: docs.length < 130,
							atStart: docs2.length < 126,
							items: docs.concat(docs2);
						});
					});
				});
			});
		}
	} else {
		if(! id || id == 0) {
			db.items.find({ }, { _id: 0 }).sort({ _id: 1 }).limit(126).exec((err, docs) => {
				if(err)	callback(err);
				callback(null, {
					atEnd: docs.length < 126,
					atStart: true,
					items: docs
				});
			});
		} else {
			db.items.find( { $and: [{ _id: { $lte: id }}, { _id: { $gt: id - 131 }}]}, (err, docs) => {
				if(err)	callback(err);
				db.items.find( { $and: [{ _id: { $gt: id }}, { _id: { $lt: id + 128 }}]}, (err, docs2) => {
					if(err)	callback(err);
					callback(null, {
						atEnd: docs.length < 130,
						atStart: docs2.length < 126,
						items: docs.concat(docs2);
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
		db.items.update({ _id: items[i].id , items[i], (err) => {
			if(err) console.log('Error Cache update Items', err);
		});
	}
	
};

exports.startCleanup = function(conf) {
	
};