var DefShopItemsDAO = require('../models/DefShopItemsDAO');
var ItemController = require('./ItemController');

module.exports = function() {
	var module = {};
	
	module.activateShopItem = function(input, output, callback) {
		if(undefined == input.data.shopId || undefined == input.data.shopItemId || undefined == input.data.sell) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		input.data.shopId     = parseInt(input.data.shopId);
		input.data.shopItemId = parseInt(input.data.shopItemId);
		input.data.sell       = parseInt(input.data.sell);

		// TODO verify player and shop def are at the same location
		
		DefShopItemsDAO().getShopItems(input.data.shopId, function(shopItemRecords) {
			// Loop and find our shop item
			var shopItemRecord = null;
			
			for(var i = 0; i < shopItemRecords.length; i++) {
				if(input.data.shopItemId == shopItemRecords[i]['shop_item_id']) {
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
			
			if(1 == input.data.sell && 0 == (shopItemRecord['flags'] & DefShopItemsDAO().FLAG_SELLABLE)) {
				output.messages.push("Item not sellable");
				callback(output);
				return;
			}
			
			var inputItem = ItemController().getItem(
				shopItemRecord['input_item_type'],
				shopItemRecord['input_item_id'],
				shopItemRecord['input_item_quantity']
			);
			
			// TODO handle selling of items
			inputItem.getPlrQuantity(input.plrId, function(num) {
				if(num < shopItemRecord['input_item_quantity']) {
					output.messages.push("Not enough input items");
					callback(output);
				} else {
					inputItem.quantity *= -1;
					
					inputItem.giveToPlayer(input.plrId, function(itemDelta) {
						var outputItem = ItemController().getItem(
							shopItemRecord['output_item_type'],
							shopItemRecord['output_item_id'],
							shopItemRecord['output_item_quantity']
						);
						
						outputItem.giveToPlayer(input.plrId, function(itemDelta) {
							output.messages.push(itemDelta);
							callback(output);
						});
					});
				}
			});
		});
	};
	
	return module;
};
