var DefCommoditiesDAO = require('../models/DefCommoditiesDAO');
var DefQuestsDAO = require('../models/DefQuestsDAO');
var PlayerQuestsDAO = require('../models/PlayerQuestsDAO');
var PlayerShipsDAO = require('../models/PlayerShipsDAO');

var ItemUtil = require('../utils/ItemUtil');

var QuestMechanics = require('../helpers/QuestMechanics');
var ShipMechanics = require('../helpers/ShipMechanics');

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
				
				// See if their ship has room for the cargo
				PlayerShipsDAO().getPlayerShips(input.plrId, function(plrShips) {
					var activeShip = plrShips.find(e => 1 == e['is_active']);
					
					if(undefined == activeShip) {
						output.messaes.push("No active ship right now");
						callback(output);
						return;
					}
					
					var cargo = BucketMechanics().createBucketFromString(activeShip['cargo']);
					
					if(ShipMechanics().getCargoCapacity(activeShip) < cargo.itemQuantitySum() + input.data.questInstance.commodityQuantity) {
						output.messages.push("Not enough room in cargo");
						callback(output);
						return;
					}
					
					// TODO verify the player is at the correct location
					
					// Success, the player is accepting a valid quest, has enough room
					
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
								var commodity = ItemUtil().getItem(
									ItemUtil().ITEM_TYPE_COMMODITY,
									input.data.questInstance.defCommodityId,
									input.data.questInstance.commodityQuantity
								);
								
								commodity.giveToPlayer(input.plrId, input.timeMs, function(res) {
									callback(output);
								});
							}
						);
					});
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
