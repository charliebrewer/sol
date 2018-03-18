var DefShopItemsDAO = require('../models/DefShopItemsDAO');
var ItemUtil = require('../utils/ItemUtil');

module.exports = function() {
	var module = {};
	
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
		
		DefShopItemsDAO().getShopItems(input.shopId, function(shopItemRecords) {
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
			inputItem.getPlrQuantity(dataBox.getPlrId(), dataBox.getTimeMs(), function(num) {
				if(num < shopItemRecord['input_item_quantity']) {
					output.messages.push("Not enough input items");
					callback(output);
				} else {
					inputItem.quantity *= -1;
					
					inputItem.giveToPlayer(dataBox.getPlrId(), dataBox.getTimeMs(), function(itemDelta) {
						var outputItem = ItemUtil().getItem(
							shopItemRecord['output_item_type'],
							shopItemRecord['output_item_id'],
							shopItemRecord['output_item_quantity']
						);
						
						outputItem.giveToPlayer(dataBox.getPlrId(), dataBox.getTimeMs(), function(itemDelta) {
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
