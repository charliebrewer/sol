const Logger = require('../helpers/Logger');
const DataValidator = require('../helpers/DataValidator');

const DefShipsDAO = require('../models/DefShipsDAO');
const DefShipModulesDAO = require('../models/DefShipModulesDAO');
const PlayerDAO = require('../models/PlayerDAO');
const PlayerShipsDAO = require('../models/PlayerShipsDAO');

const DataSources = require('../data/DataSources');
const DataBox = require('../data/DataBox'); // TODO remove

const ShopUtil = require('../utils/ShopUtil');

const BucketMechanics = require('../helpers/BucketMechanics');
const NavigationMechanics = require('../helpers/NavigationMechanics');
const ShipMechanics = require('../helpers/ShipMechanics');

module.exports = function() {
	var module = {};
	
	module.getShipMobility = function(plrShipId, callback) {
		callback(ShipMechanics().calcShipMobility(1, 1));
	};
	
	module.setActiveShip = function(dataBox, input, output, callback) {
		if(undefined == input.plrShipId) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
			var plrShip = plrShips.find(e => e['plr_ship_id'] == input.plrShipId && 0 == (PlayerShipsDAO().FLAG_SOLD & e['flags']));
			
			if(undefined == plrShip) {
				Logger().log(Logger().NORMAL, "Player " + dataBox.getPlrId() + " is trying to set a active ship that they don't have");
				callback(output);
				return;
			}
			
			PlayerDAO().getPlayer(dataBox, dataBox.getPlrId(), function(plrRecord) {
				if(plrRecord['location_type'] != NavigationMechanics().LOCATION_TYPE_STATION ||
					plrRecord['location_type'] != plrShip['location_type'] ||
					plrRecord['location_id'] != plrShip['location_id']
				) {
					output.messages.push("Can only switch ships while docked");
					callback(output);
					return;
				}
				
				// TODO verify cargo, swap cargo to new ship if possible
				
				PlayerShipsDAO().setActiveShip(dataBox, plrShip['plr_ship_id'], function(res) {
					callback(output);
				});
			});
		});
	};
	
	/**
	 * Primary way to modify the modules attached to a ship, as well as buy and
	 * sell modules. We handle all of this here because of edge cases that have
	 * to do with equipping and unequipping modules - we need to have a
	 * destination where they go. We can't just give a module to a player, it
	 * has to exist in their ship's cargo (which might not have sufficient room)
	 * or be equipped, and there's a bunch of validation that happens there.
	 *
	 * Example input below.
	 *
	 * input.sellModules = [17,5,5]; // def_ship_modules.ship_module_id
	 * input.buyModules = [
	 *     {shopId : 17, shopItemId : 288, quantity : 1},
	 *     {shopId : 17, shopItemId : 228, quantity : 1},
	 *     {shopId : 17, shopItemId : 277, quantity : 1}
	 * ];
	 * input.shipLoadout = [1,5,4,4,0,8,123,99,228]; // def_ship_modules.ship_module_id
	 */
	module.modifyModules = function(dataBox, input, output, callback) {
		if(undefined == input.sellModules || undefined == input.buyModules || undefined == input.shipLoadout) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		PlayerDAO().getPlayer(dataBox, dataBox.getPlrId(), function(plrRecord) {
			if(plrRecord['location_type'] != NavigationMechanics().LOCATION_TYPE_STATION) {
				output.messages.push("Must be at a station");
				callback(output);
				return;
			}
			
			var newCredits = plrRecord['credits'];
			
			PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
				var activeShip = plrShips.find(e => 1 == e['is_active']);
				
				if(undefined == activeShip) {
					output.messages.push("No active ship");
					callback(output);
					return;
				}
				
				var sourceModules = BucketMechanics().createBucketFromString(activeShip['cargo']);
				
				activeShip['loadout'].split(',').forEach(function(moduleId) {
					if(moduleId != '') // split returns an array containing '' as a single element when the string is empty
						sourceModules.modifyContents(BucketMechanics().ITEM_TYPE_SHIP_MODULE, moduleId, 1);
				});
				
				ShopUtil().getShopsAtStation(dataBox, plrRecord['location_id'], function(defShops, defShopItems) {
					var defShop;
					var defShopItem;
					
					// Verify buy modules and add them to our source
					for(let i = 0; i < input.buyModules.length; i++) {
						defShop = defShops.find(e => e['shop_id'] == input.buyModules[i].shopId);
						defShopItem = defShopItems.find(e => e['shop_item_id'] == input.buyModules[i].shopItemId && e['shop_id'] == input.buyModules[i].shopId);
						
						if(undefined == defShop || undefined == defShopItem) {
							output.messages.push("Buying an item not at your station");
							callback(output);
							return;
						}
						
						if(defShopItem['output_item_type'] != BucketMechanics().ITEM_TYPE_SHIP_MODULE) {
							Logger().log(Logger().ERROR, "Buying an item that isn't a module");
							callback(output);
							return;
						}
						
						if(defShopItem['input_item_type'] == BucketMechanics().ITEM_TYPE_CREDITS) {
							newCredits -= defShopItem['input_item_quantity'];
						} else {
							// TODO
							output.messages.push("Only credit prices are supported currently.");
							callback(output);
							return;
						}
						
						sourceModules.modifyContents(
							BucketMechanics().ITEM_TYPE_SHIP_MODULE,
							defShopItem['output_item_id'],
							defShopItem['output_item_quantity']
						);
					};
					
					// Source modules now contains all modules that need to be accounted for
					
					DefShipsDAO().getShips(dataBox, function(defShips) {
						var defShip = defShips.find(e => e['ship_id'] == activeShip['def_ship_id']);
						
						// Check that player is selling items they already have, we don't care if they're buying and selling
						DefShipModulesDAO().getShipModules(dataBox, function(defShipModules) {
							if(!ShipMechanics().validateLoadout(input.shipLoadout, defShip['configuration'], defShipModules)) {
								output.messages.push("Invalid loadout");
								callback(output);
								return;
							}
							
							var defShipModule;
							var quantity;
							var handledModuleIds = [];
							
							for(let i = 0; i < input.sellModules.length; i++) {
								if(handledModuleIds.includes(input.sellModules[i])) {
									continue;
								}
								
								handledModuleIds.push(input.sellModules[i]);
								
								quantity = input.sellModules.filter(e => e == input.sellModules[i]).length;
								
								if(sourceModules.getItemQuantity(BucketMechanics().ITEM_TYPE_SHIP_MODULE, input.sellModules[i]) < quantity) {
									output.messages.push("You're trying to sell modules you don't have");
									callback(output);
									return;
								}
								
								defShipModule = defShipModules.find(e => e['ship_module_id'] == input.sellModules[i]);
								if(undefined == defShipModule) {
									output.messages.push("Invalid module");
									callback(output);
									return;
								}
								
								if(0 == defShipModule['sell_price']) {
									output.messages.push("Can't sell this module");
									callback(output);
									return;
								}
								
								newCredits += defShipModule['sell_price'] * quantity;
								
								sourceModules.modifyContents(BucketMechanics().ITEM_TYPE_SHIP_MODULE, input.sellModules[i], -1 * quantity);
							};
							
							if(0 > newCredits) {
								output.messages.push("Not enough credits");
								callback(output);
								return;
							}
							
							// Selling items have been removed, now remove equipped items
							for(let i = 0; i < input.shipLoadout.length; i++) {
								if(0 >= sourceModules.getItemQuantity(BucketMechanics().ITEM_TYPE_SHIP_MODULE, input.shipLoadout[i])) {
									output.messages.push("Not enough modules to equip");
									callback(output);
									return;
								}
								
								sourceModules.modifyContents(BucketMechanics().ITEM_TYPE_SHIP_MODULE, input.shipLoadout[i], -1);
							};
							
							// Check that each of the remaining modules can be stored in a ship's cargo
							var err = false;
							sourceModules.forEachItem(function(itemType, itemId, itemQuantity) {
								if(itemType == BucketMechanics().ITEM_TYPE_SHIP_MODULE) {
									defShipModule = defShipModules.find(e => e['ship_module_id'] == itemId);
									
									if(0 == (defShipModule['flags'] & DefShipModulesDAO().FLAG_CAN_BE_CARGO)) {
										err = true;
									}
								}
							});
							
							if(err) {
								output.messages.push("Can't store these modules in your cargo");
								callback(output);
								return;
							}
							
							// Check that the player has enough room for the remaining items in their cargo
							// Set their loadout first because they might have changed cargo properties
							activeShip['loadout'] = input.shipLoadout.join(',');
							
							// TODO get mass of modules
							if(sourceModules.itemQuantitySum() > ShipMechanics().getCargoCapacity(activeShip, defShipModules)) {
								output.messages.push("Not enough room in cargo");
								callback(output);
								return;
							}
							
							// Success! Store loadout and cargo, take away items per the shop (TODO), and adjust the players credits
							plrRecord['credits'] = newCredits;
							
							PlayerDAO().updatePlayer(dataBox, plrRecord, function() {
								activeShip['cargo'] = sourceModules.getItemsString();
								
								PlayerShipsDAO().storePlayerShip(dataBox, activeShip, function() {
									callback(output);
								});
							});
						});
					});
				});
			});
		});
	};
	
	/**
	 * Used to both get info about the player's ship as well as info about other ships.
	 */
	module.getShipInfo = function(dataBox, input, output, callback) {
dataBox = DataBox().getDataBoxServerStandard(); // TODO remove
		input = DataValidator.cleanObj(input, {
			plrShipId: {type: DataValidator.DATA_INT}
		});
		
		output.data = {failed: true, plrShip: {}, anomaly: {}};
		
		// Check if this is the ship the player is on
		dataBox.getData(DataSources.DAO_PLR_SHIP, input.plrShipId, function(plrShip) {
			if(undefined == plrShip) {
				output.messages.push('no ship found');
				callback(output);
				return;
			}
			
			output.data.failed = false;
			output.data.plrShip = plrShip;
			
			if(plrShip.loc_type != NavigationMechanics().LOCATION_TYPE_ROUTE) {
				callback(output);
			} else {
				dataBox.getData(DataSources.DAO_ANOMALIES, plrShip.loc_id, function(anomaly) {
					output.data.anomaly = anomaly;
					
					callback(output);
				});
			}
		});
		
		// Check if the player has permission to view all info TODO day 2
		// Check if the ship is within range of the player
	};
	
	return module;
};
