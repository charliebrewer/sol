var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.params = {
		tableName      : 'def_quests',
		keyName        : 'quest_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_ALL
	};
	
	module.getQuests = function(dataBox, callback) {
		PersistentDataAccess().getData(dataBox, module.params, 0, callback);
	};
	
	return module;
};
