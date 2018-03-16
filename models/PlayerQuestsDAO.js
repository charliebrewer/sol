var sprintf = require("sprintf-js").sprintf;

var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.tableName = 'plr_quests';
	module.keyName   = 'plr_id';
	module.fields    = [
		'plr_quest_id',
		'plr_id',
		'def_commodity_id',
		'commodity_quantity',
		'total_value',
		'start_time_sc',
		'max_time_sc',
		'completed_time_sc',
		'destination_station_id',
		'flags'
	];
	
	module.getPlayerQuests = function(plrId, callback) {
		PersistentDataAccess().selectMany(module.tableName, module.keyName, plrId, callback);
	};
	
	module.storePlrQuest = function(
		plrQuests,
		plrId,
		defCommodityId,
		commodityQuantity,
		totalValue,
		startTimeSc,
		maxTimeSc,
		completedTimeSc,
		destinationStationId,
		flags,
		callback
	) {
		var row = {
			'plr_id' : plrId,
			'def_commodity_id' : defCommodityId,
			'commodity_quantity' : commodityQuantity,
			'total_value' : totalValue,
			'start_time_sc' : startTimeSc,
			'max_time_sc' : maxTimeSc,
			'completed_time_sc' : completedTimeSc,
			'destination_station_id' : destinationStationId,
			'flags' : flags
		};
		
		var oldQuest = plrQuests.find(e => module.canRecycleRecord(e));
		if(undefined != oldQuest) {
			row['plr_quest_id'] = oldQuest['plr_quest_id'];
		}
		
		PersistentDataAccess().updateOrInsert(module.tableName, row, callback);
	};
	
	module.completeQuestsAtStation = function(plrId, defStationId, timeMs, callback) {
		var timeSc = Math.round(timeMs / 1000);
		
		var queryStr = sprintf(
			"UPDATE %s SET completed_time_sc = %i WHERE plr_id = %i AND destination_station_id = %i",
			module.tableName,
			timeSc,
			plrId,
			defStationId
		);
		
		PersistentDataAccess().query(queryStr, callback);
	};
	
	module.canRecycleRecord = function(plrQuest) {
		return 0 != plrQuest['completed_time_sc'];
	};
	
	return module;
};
