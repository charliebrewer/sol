const DefShopsDAO = require('../models/DefShopsDAO');
const DefShopItemsDAO = require('../models/DefShopItemsDAO');
const ItemUtil = require('../utils/ItemUtil');
const PlayerUtil = require('../utils/PlayerUtil');
const ShopUtil = require('../utils/ShopUtil');
const NavigationMechanics = require('../helpers/NavigationMechanics');

module.exports = function() {
	var module = {};
	
	module.getShopsAtStation = function(dataBox, input, output, callback) {
		output.data.defShops = [];
		output.data.defShopItems = [];
		
		if(undefined == input.stationId) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		ShopUtil().getShopsAtStation(dataBox, input.stationId, function(defShops, defShopItems) {
			output.data.defShops = defShops;
			output.data.defShopItems = defShopItems;
			
			callback(output);
		});
	};
	
	module.activateShopItem = function(dataBox, input, output, callback) {
		if(undefined == input.shopItemId || undefined == input.sell) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		PlayerUtil().getPlayerLocation(dataBox, dataBox.getPlrId(), dataBox.getTimeMs(), function(locationType, locationId) {
			if(NavigationMechanics().LOCATION_TYPE_STATION != locationType) {
				output.messages.push("Not at a station");
				callback(output);
				return;
			}
			
			ShopUtil().getShopsAtStation(dataBox, locationId, function(defShops, defShopItems) {
				var shopItemRecord = defShopItems.find(e => e['shop_item_id'] == input.shopItemId);
				
				if(undefined == shopItemRecord) {
					output.messages.push("Item not found");
					callback(output);
					return;
				}
				
				if(1 == input.sell && 0 == (shopItemRecord['flags'] & DefShopItemsDAO().FLAG_SELLABLE)) {
					output.messages.push("Item not sellable");
					callback(output);
					return;
				}
				
				var inputItem = ItemUtil().getItem(
					shopItemRecord['input_item_type'],
					shopItemRecord['input_item_id'],
					shopItemRecord['input_item_quantity']
				);
				
				// TODO handle selling of items
				inputItem.getNum(dataBox, dataBox.getPlrId(), function(num) {
					if(num < shopItemRecord['input_item_quantity']) {
						output.messages.push("Not enough input items");
						callback(output);
						return;
					}
					
					inputItem.take(dataBox, dataBox.getPlrId(), function(itemDelta) {
						var outputItem = ItemUtil().getItem(
							shopItemRecord['output_item_type'],
							shopItemRecord['output_item_id'],
							shopItemRecord['output_item_quantity']
						);
						
						outputItem.give(dataBox, dataBox.getPlrId(), function(itemDelta) {
							output.data = itemDelta;
							callback(output);
						});
					});
				});
			});
		});
	};
	
	return module;
};
