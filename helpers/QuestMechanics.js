module.exports = function() {
	var module = {};
	
	module.CMPLT_PCT_WINDOW_SC   = 86400;
	module.QUEST_VALUE_WINDOW_SC = 86400;
	module.RECYCLE_WINDOW_SC     = 86400; // plr_quests records are recycled after this time
	
	/**
	 * Data structure for a generated quest instance.
	 *
	 * @param defQuestId The definition quest this instance was based off of
	 * @param maxTimeSc The total time that the player has to complete this quest, not the real time but the delta
	 */
	module.getQuestInstance = function(defQuestId, destinationStationId, defCommodityId, commodityQuantity, questValue, maxTimeSc, rewardItemType, rewardItemId, rewardItemQuantity) {
		var quest = {};
		
		quest.defQuestId           = defQuestId;
		quest.destinationStationId = destinationStationId;
		quest.defCommodityId       = defCommodityId;
		quest.commodityQuantity    = commodityQuantity;
		quest.questValue           = questValue;
		quest.maxTimeSc            = maxTimeSc;
		quest.rewardItemType       = rewardItemType;
		quest.rewardItemId         = rewardItemId;
		quest.rewardItemQuantity   = rewardItemQuantity;
		
		return quest;
	};
	
	/**
	 * Function to take a quest definition and generate a questInstance data structure.
	 */
	module.generateQuestInstance = function(defQuest, defCommodities) {
		var commodities = defCommodities.filter(e => e['commodity_type'] == defQuest['cargo_commodity_type']);
		var commodity = commodities[Math.floor(Math.random() * commodities.length)];
		
		var cargoQuantity = Math.floor(Math.random() * (defQuest['cargo_quantity_max'] - defQuest['cargo_quantity_min'])) + defQuest['cargo_quantity_min'];
		
		var destStations = defQuest['destination_station_ids'].split(',');
		var destStationId = destStations[Math.floor(Math.random() * destStations.length)];
		
		var rewardItemQuantity = defQuest['reward_item_quantity_min'] + Math.floor(Math.random() * (defQuest['reward_item_quantity_max'] - defQuest['reward_item_quantity_min']));
		
		return module.getQuestInstance(
			defQuest['quest_id'],
			destStationId,
			commodity['commodity_id'],
			cargoQuantity,
			defQuest['quest_value'],
			defQuest['max_time_sc'],
			defQuest['reward_item_type'],
			defQuest['reward_item_id'],
			rewardItemQuantity
		);
	};
	
	module.validateQuestInstance = function(defQuest, defCommodities, questInstance) {
		if(questInstance.commodityQuantity > defQuest['cargo_quantity_max'])
			return false;
		if(questInstance.commodityQuantity < defQuest['cargo_quantity_min'])
			return false;
		if(questInstance.rewardItemType != defQuest['reward_item_type'])
			return false;
		if(questInstance.rewardItemId != defQuest['reward_item_id'])
			return false;
		if(questInstance.rewardItemQuantity < defQuest['reward_item_quantity_min'])
			return false;
		if(questInstance.rewardItemQuantity > defQuest['reward_item_quantity_max'])
			return false;
		if(questInstance.maxTimeSc != defQuest['max_time_sc'])
			return false;
		
		var commodities = defCommodities.filter(e => e['commodity_type'] == defQuest['cargo_commodity_type']);
		if(undefined == commodities.find(e => e['commodity_id'] == questInstance.defCommodityId))
			return false;
		
		var destStations = defQuest['destination_station_ids'].split(',');
		if(undefined == destStations.find(e => e == questInstance.destinationStationId))
			return false;
		
		return true;
	};
	
	// For the completion of a single quest
	module.getQuestCmpltPct = function(defQuest, plrQuest, plrCargoStr) {
		// TODO
		return 1;
	};
	
	// For the completion rate of all of a player's completed quests
	module.getPlrCmpltPct = function(currTimeMs, plrQuests) {
		var c   = 0;
		var sum = 0;
		var cutoffTimeSc = Math.round((currTimeMs / 1000) - module.CMPLT_PCT_WINDOW_SC);
		
		plrQuests.forEach(function(plrQuest) {
			if(plrQuest['completed_time_sc'] > cutoffTimeSc) {
				c++;
				sum += plrQuest['completed_pct_1000'];
			}
		});
		
		if(0 == c)
			return 1;
		
		sum /= 1000;
		
		return sum / c;
	};
	
	/**
	 * Gets the sum of the quest value of all player quests within the
	 * QUEST_VALUE_WINDOW_SC window. This does not count any active quests.
	 */
	module.getPlrQuestValueSum = function(currTimeMs, plrQuests) {
		var sum = 0;
		var cutoffTimeSc = Math.round((currTimeMs / 1000) - module.QUEST_VALUE_WINDOW_SC);
		
		plrQuests.forEach(function(plrQuest) {
			if(plrQuest['completed_time_sc'] > cutoffTimeSc)
				sum += plrQuest['quest_value'];
		});
		
		return sum;
	};
	
	return module;
};
