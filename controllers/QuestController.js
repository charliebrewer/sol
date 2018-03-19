var DefCommoditiesDAO = require('../models/DefCommoditiesDAO');
var DefQuestsDAO = require('../models/DefQuestsDAO');
var PlayerDAO = require('../models/PlayerDAO');
var PlayerQuestsDAO = require('../models/PlayerQuestsDAO');
var PlayerShipsDAO = require('../models/PlayerShipsDAO');

var ItemUtil = require('../utils/ItemUtil');

var BucketMechanics = require('../helpers/BucketMechanics');
var NavigationMechanics = require('../helpers/NavigationMechanics');
var QuestMechanics = require('../helpers/QuestMechanics');
var ShipMechanics = require('../helpers/ShipMechanics');

module.exports = function() {
	var module = {};
	
	module.MAX_ACTIVE_QUESTS = 10;
	
	module.acceptQuest = function(dataBox, input, output, callback) {
		if(undefined == input.defQuestId || undefined == input.questInstance) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		DefQuestsDAO().getQuests(dataBox, function(defQuests) {
			DefCommoditiesDAO().getCommodities(dataBox, function(defCommodities) {
				var defQuest = defQuests.find(function(e) { return e['quest_id'] == input.defQuestId; });
				
				if(undefined == defQuest) {
					output.messages.push("Couldn't find quest: " + input.defQuestId);
					callback(output);
					return;
				}
				
				if(!QuestMechanics().validateQuestInstance(defQuest, defCommodities, input.questInstance)) {
					output.messages.push("Invalid quest instance");
					callback(output);
					return;
				}
				
				// See if their ship has room for the cargo
				PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
					var activeShip = plrShips.find(e => 1 == e['is_active']);
					
					if(undefined == activeShip) {
						output.messages.push("No active ship right now");
						callback(output);
						return;
					}
					
					var cargo = BucketMechanics().createBucketFromString(activeShip['cargo']);
					
					if(ShipMechanics().getCargoCapacity(activeShip, []) < cargo.itemQuantitySum() + input.questInstance.commodityQuantity) {
						output.messages.push("Not enough room in cargo");
						callback(output);
						return;
					}
					
					PlayerDAO().getPlayer(dataBox, function(plrRecord) {
						if(NavigationMechanics().LOCATION_TYPE_STATION != plrRecord['location_type'] || defQuest['station_id'] != plrRecord['location_id']) {
							output.messages.push("Not at the correct station");
							callback(output);
							return;
						}
						
						// Success, the player is accepting a valid quest, has enough room
						
						PlayerQuestsDAO().getPlayerQuests(dataBox, function(plrQuests) {
							var newQuest = PlayerQuestsDAO().newRow(
								dataBox.getPlrId(),
								input.questInstance.defCommodityId,
								input.questInstance.commodityQuantity,
								input.questInstance.totalValue,
								Math.round(dataBox.getTimeMs() / 1000),
								input.questInstance.maxTimeSc,
								input.questInstance.destinationStationId,
								plrQuests
							);
							
							PlayerQuestsDAO().storePlrQuest(dataBox, newQuest, function(pqOutput) {
								var commodity = ItemUtil().getItem(
									ItemUtil().ITEM_TYPE_COMMODITY,
									input.questInstance.defCommodityId,
									input.questInstance.commodityQuantity
								);
								
								commodity.giveToPlayer(dataBox, function(res) {
									// output.data.commoditiesLoaded = res?
									callback(output);
								});
							});
						});
					});
				});
			});
		});
	};
	
	module.arriveAtStation = function(dataBox, input, output, callback) {
		// Check if this player has any quests that are not complete and will be completed at this station
		// Complete them
		if(undefined == input.defStationId) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		PlayerDAO().getPlayer(dataBox, function(plrRecord) {
			if(NavigationMechanics().LOCATION_TYPE_STATION != plrRecord['location_type'] || input.defStationId != plrRecord['location_id']) {
				output.messages.push("Not at the correct station");
				callback(output);
				return;
			}
			
			var timeSc = Math.round(dataBox.getTimeMs() / 1000);
			
			PlayerQuestsDAO().getPlayerQuests(dataBox, function(plrQuests) {
				var questsToComplete = plrQuests.filter(e => 0 == e['completed_time_sc'] && input.defStationId == e['destination_station_id']);
				
				if(questsToComplete.length > 0)
					PlayerQuestsDAO().completeQuestsAtStation(dataBox, input.defStationId, function() {});
				
				questsToComplete.forEach(function(quest) {
					if(quest['start_time_sc'] + quest['max_time_sc'] > timeSc) {
						var cargo = ItemUtil().getItem(
							ItemUtil().ITEM_TYPE_COMMODITY,
							quest['def_commodity_id'],
							quest['commodity_quantity']
						);
						
						cargo.getPlrQuantity(dataBox, function(plrCargoQuantity) {
							if(plrCargoQuantity >= quest['commodity_quantity']) {
								// Success, the player has completed the mission under the required time and has all the items
								cargo.quantity *= -1;
								cargo.giveToPlayer(dataBox, function() {});
								
								var reward = ItemUtil().getItem(
									ItemUtil().ITEM_TYPE_CREDITS,
									0,
									quest['total_value']
								);
								
								reward.giveToPlayer(dataBox, function() {});
							}
						});
					}
				});
				
				callback(output);
			});
		});
	};
	
	return module;
};
