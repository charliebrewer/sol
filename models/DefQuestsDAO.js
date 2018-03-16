var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.tableName = 'def_quests';
	module.keyName   = 'quest_id';
	module.fields    = [
		'quest_id',
		'station_id',
		'commodity_type',
		'min_reputation',
		'cargo_value',
		'min_cargo',
		'max_cargo',
		'max_time',
		'destination_station_ids',
		'flags'
	];
	
	module.getQuests = function(callback) {
		PersistentDataAccess().selectAll(module.tableName, callback);
	};
	
	return module;
};
