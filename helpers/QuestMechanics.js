module.exports = function() {
	var module = {};
	
	/**
	 * Data structure for a generated quest instance.
	 *
	 * @param defQuestId The definition quest this instance was based off of
	 * @param maxTimeSc The total time that the player has to complete this quest, not the real time but the delta
	 */
	module.getQuestInstance = function(defCommodityId, commodityQuantity, totalValue, maxTimeSc, destinationStationId) {
		var quest = {};
		
		quest.defCommodityId = defCommodityId;
		quest.commodityQuantity = commodityQuantity;
		quest.totalValue = totalValue;
		quest.maxTimeSc = maxTimeSc;
		quest.destinationStationId = destinationStationId;
		
		return quest;
	};
	
	/**
	 * Function to take a quest definition and generate a questInstance data structure.
	 */
	module.generateQuestInstance = function(defQuest, defCommodities) {
		var commodities = defCommodities.filter(e => e['commodity_type'] == defQuest['commodity_type']);
		var commodity = commodities[Math.floor(Math.random() * commodities.length)];
		
		var cargoQuantity = Math.floor(Math.random() * (defQuest['max_cargo'] - defQuest['min_cargo'])) + defQuest['min_cargo'];
		
		var destStations = defQuest['destination_station_ids'].split(',');
		var destStationId = destStations[Math.floor(Math.random() * destStations.length)];
		
		return module.getQuestInstance(
			commodity['commodity_id'],
			cargoQuantity,
			cargoQuantity * defQuest['cargo_value'],
			defQuest['max_time_sc'],
			destStationId
		);
	};
	
	module.validateQuestInstance = function(defQuest, defCommodities, questInstance) {
		if(questInstance.commodityQuantity > defQuest['max_cargo'])
			return false;
		if(questInstance.commodityQuantity < defQuest['min_cargo'])
			return false;
		if(questInstance.totalValue != defQuest['cargo_value'] * questInstance.commodityQuantity)
			return false;
		if(questInstance.maxTimeSc != defQuest['max_time_sc'])
			return false;
		
		var commodities = defCommodities.filter(e => e['commodity_type'] == defQuest['commodity_type']);
		if(undefined == commodities.find(e => e['commodity_id'] == questInstance.defCommodityId))
			return false;
		
		var destStations = defQuest['destination_station_ids'].split(',');
		if(undefined == destStations.find(e => e == questInstance.destinationStationId))
			return false;
		
		return true;
	};
	
	return module;
};
