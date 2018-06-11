var DefShopsDAO = require('../models/DefShopsDAO');
var DefShopItemsDAO = require('../models/DefShopItemsDAO');
var ItemUtil = require('../utils/ItemUtil');

module.exports = function() {
	var module = {};
	
	module.getShopsAtStation = function(dataBox, input, output, callback) {
		// TODO just call ShopUtil to get this information
		output.data.defShops = [];
		output.data.defShopItems = [];
		
		if(undefined == input.stationId) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		input.stationId = parseInt(input.stationId);
		
		DefShopsDAO().getShops(dataBox, function(defShops) {
			var defShopsAtStation = defShops.filter(e => e['station_id'] == input.stationId);
			
			if(0 == defShopsAtStation.length) {
				callback(output);
				return;
			}
			
			var shopIds = [];
			defShopsAtStation.forEach(function(defShop) {
				shopIds.push(defShop['shop_id']);
			});
			
			DefShopItemsDAO().getShopItemsAtShops(dataBox, shopIds, function(defShopItems) {
				output.data.defShops = defShopsAtStation;
				output.data.defShopItems = defShopItems;
				
				callback(output);
			});
		});
	};
	
	module.activateShopItem = function(dataBox, input, output, callback) {
		if(undefined == input.shopId || undefined == input.shopItemId || undefined == input.sell) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		input.shopId     = parseInt(input.shopId);
		input.shopItemId = parseInt(input.shopItemId);
		input.sell       = parseInt(input.sell);

		// TODO verify player and shop def are at the same location
		
		DefShopItemsDAO().getShopItems(dataBox, input.shopId, function(shopItemRecords) {
			// Loop and find our shop item
			var shopItemRecord = null;
			
			for(var i = 0; i < shopItemRecords.length; i++) {
				if(input.shopItemId == shopItemRecords[i]['shop_item_id']) {
					shopItemRecord = shopItemRecords[i];
					break;
				}
			}
			
			if(null == shopItemRecord) {
				// TODO throw err
				output.messages.push("Could not find shop item");
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
				} else {
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
				}
			});
		});
	};
	
	return module;
};
