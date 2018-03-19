var sprintf = require("sprintf-js").sprintf;

var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.params = {
		tableName      : 'plr_quests',
		keyName        : 'plr_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_MANY
	};
	
	module.getPlayerQuests = function(dataBox, callback) {
		PersistentDataAccess().getData(dataBox, module.params, dataBox.getPlrId(), callback);
	};
	
	module.newRow = function(
		plrId,
		defCommodityId,
		commodityQuantity,
		totalValue,
		startTimeSc,
		maxTimeSc,
		destinationStationId,
		plrQuests = []
	) {
		var row = {};
		
		row.plr_id                 = plrId;
		row.def_commodity_id       = defCommodityId;
		row.commodity_quantity     = commodityQuantity;
		row.total_value            = totalValue;
		row.start_time_sc          = startTimeSc;
		row.max_time_sc            = maxTimeSc;
		row.destination_station_id = destinationStationId;
		
		row.completed_time_sc      = 0;
		row.flags                  = 0;
		
		var oldQuest = plrQuests.find(e => 0 != e['completed_time_sc']);
		if(undefined != oldQuest) {
			row.plr_quest_id = oldQuest['plr_quest_id'];
		}
		
		return row;
	};
	
	module.storePlrQuest = function(dataBox, plrQuest, callback) {
		PersistentDataAccess().setData(dataBox, module.params, plrQuest, callback);
	};
	
	module.completeQuestsAtStation = function(dataBox, defStationId, callback) {
		PersistentDataAccess().clearCache(dataBox, module.params, dataBox.getPlrId());
		
		var timeSc = Math.round(dataBox.getTimeMs() / 1000);
		
		var queryStr = sprintf(
			"UPDATE %s SET completed_time_sc = %i WHERE plr_id = %i AND destination_station_id = %i",
			module.params.tableName,
			timeSc,
			dataBox.getPlrId(),
			defStationId
		);
		
		PersistentDataAccess().query(queryStr, callback);
	};
	
	return module;
};
