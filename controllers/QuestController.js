var DefCommoditiesDAO = require('../models/DefCommoditiesDAO');
var DefQuestsDAO = require('../models/DefQuestsDAO');
var PlayerQuestsDAO = require('../models/PlayerQuestsDAO');

var ItemUtil = require('../utils/ItemUtil');

var QuestMechanics = require('../helpers/QuestMechanics');

module.exports = function() {
	var module = {};
	
	module.MAX_ACTIVE_QUESTS = 10;
	
	module.acceptQuest = function(input, output, callback) {
		if(undefined == input.data.defQuestId || undefined == input.data.questInstance) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		DefQuestsDAO().getQuests(function(defQuests) {
			DefCommoditiesDAO().getCommodities(function(defCommodities) {
				var defQuest = defQuests.find(function(e) { return e['quest_id'] == input.data.defQuestId; });
				
				if(undefined == defQuest) {
					output.messaes.push("Couldn't find quest: " + input.data.defQuestId);
					callback(output);
					return;
				}
				
				if(!QuestMechanics().validateQuestInstance(defQuest, defCommodities, input.data.questInstance)) {
					output.messages.push("Invalid quest instance");
					callback(output);
					return;
				}
				
				PlayerQuestsDAO().getPlayerQuests(input.plrId, function(plrQuests) {
					PlayerQuestsDAO().storePlrQuest(
						plrQuests,
						input.plrId,
						input.data.questInstance.defCommodityId,
						input.data.questInstance.commodityQuantity,
						input.data.questInstance.totalValue,
						Math.round(input.timeMs / 1000),
						input.data.questInstance.maxTimeSc,
						0,
						input.data.questInstance.destinationStationId,
						0,
						function(pqOutput) {
							// TODO give the player the cargo to deliver
							callback(output);
						}
					);
				});
			});
		});
	};
	
	module.arriveAtStation = function(input, output, callback) {
		// Check if this player has any quests that are not complete and will be completed at this station
		// Complete them
		if(undefined == input.data.defStationId) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		// TODO ensure player is actually at this station
		
		var timeSc = Math.round(input.timeMs / 1000);
		
		PlayerQuestsDAO().getPlayerQuests(input.plrId, function(plrQuests) {
			var questsToComplete = plrQuests.filter(e => 0 == e['completed_time_sc'] && input.data.defStationId == e['destination_station_id']);
			
			if(questsToComplete.length > 0)
				PlayerQuestsDAO().completeQuestsAtStation(input.plrId, input.data.defStationId, input.timeMs, function() {});
			
			questsToComplete.forEach(function(quest) {
				if(quest['start_time_sc'] + quest['max_time_sc'] > timeSc) {
					var cargo = ItemUtil().getItem(
						ItemUtil().ITEM_TYPE_COMMODITY,
						quest['def_commodity_id'],
						quest['commodity_quantity']
					);
					
					cargo.getPlrQuantity(input.plrId, input.timeMs, function(plrCargoQuantity) {
						if(plrCargoQuantity >= quest['commodity_quantity']) {
							// Success, the player has completed the mission under the required time and has all the items
							cargo.quantity *= -1;
							cargo.giveToPlayer(input.plrId, input.timeMs, function() {});
							
							var reward = ItemUtil().getItem(
								ItemUtil().ITEM_TYPE_CREDITS,
								0,
								quest['total_value']
							);
							
							reward.giveToPlayer(input.plrId, input.timeMs, function() {});
						}
					});
				}
			});
			
			callback(output);
		});
	};
	
	return module;
};
