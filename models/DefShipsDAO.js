var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.params = {
		tableName      : 'def_ships',
		keyName        : 'ship_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_ALL
	};
	
	module.getShips = function(dataBox, callback) {
		PersistentDataAccess().getData(dataBox, module.params, 0, callback);
	};
	
	return module;
};
