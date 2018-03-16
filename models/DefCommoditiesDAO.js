var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.tableName = 'def_commodities';
	module.keyName   = 'commodity_id';
	module.fields    = ['commodity_id', 'commodity_type', 'name', 'flags'];
	
	module.getCommodities = function(callback) {
		PersistentDataAccess().selectAll(module.tableName, callback);
	};
	
	return module;
};
