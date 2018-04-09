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
		destinationStationId,
		defCommodityId,
		commodityQuantity,
		questValue,
		rewardItemType,
		rewardItemId,
		rewardItemQuantity,
		startTimeSc,
		maxTimeSc,
		recyclePlrQuestId = 0
	) {
		var row = {};
		
		row.plr_id                 = plrId;
		row.destination_station_id = destinationStationId;
		row.def_commodity_id       = defCommodityId;
		row.commodity_quantity     = commodityQuantity;
		row.quest_value            = questValue;
		row.reward_item_type       = rewardItemType;
		row.reward_item_id         = rewardItemId;
		row.reward_item_quantity   = rewardItemQuantity;
		row.start_time_sc          = startTimeSc;
		row.max_time_sc            = maxTimeSc;
		
		row.completed_time_sc      = 0;
		row.completed_pct_1000     = 0;
		row.flags                  = 0;
		
		if(0 != recyclePlrQuestId)
			row.plr_quest_id = recyclePlrQuestId;
		
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
