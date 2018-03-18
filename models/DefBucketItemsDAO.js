var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.params = {
		tableName      : 'def_bucket_items',
		keyName        : 'bucket_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_MANY,
		fields         : []
	};
	
	module.getBucketItems = function(dataBox, bucketId, callback) {
		PersistentDataAccess().getData(dataBox, module.params, bucketId, callback);
	};
	
	return module;
};
