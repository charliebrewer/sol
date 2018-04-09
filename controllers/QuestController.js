var DefCommoditiesDAO = require('../models/DefCommoditiesDAO');
var DefQuestsDAO = require('../models/DefQuestsDAO');
var DefShipModulesDAO = require('../models/DefShipModulesDAO');
var PlayerDAO = require('../models/PlayerDAO');
var PlayerQuestsDAO = require('../models/PlayerQuestsDAO');
var PlayerShipsDAO = require('../models/PlayerShipsDAO');

var ItemUtil = require('../utils/ItemUtil');
var QuestUtil = require('../utils/QuestUtil');

var BucketMechanics = require('../helpers/BucketMechanics');
var NavigationMechanics = require('../helpers/NavigationMechanics');
var QuestMechanics = require('../helpers/QuestMechanics');
var ShipMechanics = require('../helpers/ShipMechanics');

module.exports = function() {
	var module = {};
	
	module.MAX_ACTIVE_QUESTS = 10;
	
	/**
	 * Function to determine quests that the player can potentially accept.
	 */
	module.getQuests = function(dataBox, input, output, callback) {
		QuestUtil().getQuestsAvailableToPlr(dataBox, function(defQuests) {
			output.data = defQuests;
			
			callback(output);
		});
	};
	
	module.acceptQuest = function(dataBox, input, output, callback) {
		if(undefined == input.defQuestId || undefined == input.questInstance) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		QuestUtil().getQuestsAvailableToPlr(dataBox, function(defQuests) {
			DefCommoditiesDAO().getCommodities(dataBox, function(defCommodities) {
				var defQuest = defQuests.find(e => e['quest_id'] == input.defQuestId);
				
				if(undefined == defQuest) {
					output.messages.push("Invalid quest");
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
					
					DefShipModulesDAO().getShipModules(dataBox, function(defShipModules) {
						if(ShipMechanics().getCargoCapacity(activeShip, defShipModules) < cargo.itemQuantitySum() + input.questInstance.commodityQuantity) {
							output.messages.push("Not enough room in cargo");
							callback(output);
							return;
						}

						// Success, the player is accepting a valid quest, has enough room
						PlayerQuestsDAO().getPlayerQuests(dataBox, function(plrQuests) {
							var recycleRecord = plrQuests.find(function(plrQuest) {
								if(plrQuest['completed_time_sc'] < (dataBox.getTimeMs() / 1000) - QuestMechanics().RECYCLE_WINDOW_SC)
									return true;
								
								return false;
							});
							
							var newQuest = PlayerQuestsDAO().newRow(
								dataBox.getPlrId(),
								input.questInstance.destinationStationId,
								input.questInstance.defCommodityId,
								input.questInstance.commodityQuantity,
								input.questInstance.questValue,
								input.questInstance.rewardItemType,
								input.questInstance.rewardItemId,
								input.questInstance.rewardItemQuantity,
								Math.round(dataBox.getTimeMs() / 1000),
								input.questInstance.maxTimeSc,
								undefined == recycleRecord ? 0 : recycleRecord['plr_quest_id']
							);
							
							PlayerQuestsDAO().storePlrQuest(dataBox, newQuest, function(pqOutput) {
								var commodity = ItemUtil().getItem(
									BucketMechanics().ITEM_TYPE_COMMODITY,
									input.questInstance.defCommodityId,
									input.questInstance.commodityQuantity
								);
								
								commodity.give(dataBox, dataBox.getPlrId(), function(res) {
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
	
	module.completeQuest = function(dataBox, input, output, callback) {
		if(undefined == input.plrQuestId || undefined == input.completionPct1000) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		PlayerQuestsDAO().getPlayerQuests(dataBox, function(plrQuests) {
			var plrQuest = plrQuests.find(e => e['plr_quest_id'] == input.plrQuestId);
			
			if(undefined == plrQuest || plrQuest['completed_time_sc'] != 0) {
				output.messages.push("Invalid quest");
				callback(output);
				return;
			}
			
			// The player who owns this quest is completing it, before we reward them just complete it
			plrQuest['completed_time_sc'] = Math.round(dataBox.getTimeMs() / 1000);
			PlayerQuestsDAO().storePlrQuest(dataBox, plrQuest, function() {});
			
			PlayerDAO().getPlayer(dataBox, dataBox.getPlrId(), function(plrRecord) {
				if(NavigationMechanics().LOCATION_TYPE_STATION != plrRecord['location_type']) {
					output.messages.push("Not at a station");
					callback(output);
					return;
				}
				
				if(plrRecord['location_id'] != plrQuest['destination_station_id']) {
					output.messages.push("Not at the destination station");
					callback(output);
					return;
				}
				
				if(plrQuest['start_time_sc'] + plrQuest['max_time_sc'] < dataBox.getTimeMs() / 1000) {
					output.messages.push("Took too long");
					callback(output);
					return;
				}
				
				var cargo = ItemUtil().getItem(
					BucketMechanics().ITEM_TYPE_COMMODITY,
					plrQuest['def_commodity_id'],
					plrQuest['commodity_quantity']
				);
				
				cargo.getPlrQuantity(dataBox, function(plrCargoQuantity) {
					if(plrCargoQuantity >= plrQuest['commodity_quantity']) {
						// Success, the player has completed the mission under the required time and has all the items
						cargo.take(dataBox, dataBox.getPlrId(), function() {});
						
						var reward = ItemUtil().getItem(
							BucketMechanics().ITEM_TYPE_CREDITS,
							0,
							plrQuest['total_value']
						);
						
						reward.give(dataBox, dataBox.getPlrId(), function() {});
						
						callback(output);
					}
				});
			});
		});
	};
	
	return module;
};
