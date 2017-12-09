var PlayerDAO = require('../models/PlayerDAO');

module.exports = function() {
	var module = {};
	
	module.ITEM_TYPE_NOTHING   = 0;
	module.ITEM_TYPE_BUCKET    = 1;
	module.ITEM_TYPE_CREDITS   = 2;
	/*
	SHIP
	COMMODITY
	MODULE
	etc
	*/
	
	module.giveItemToPlayer = function(plrId, itemType, itemId, quantity, callback) {
		var itemDelta = [];
		itemDelta.push({"itemType" : itemType, "itemId" : itemId, "quantity" : quantity});
		
		switch(itemType) {
			case module.ITEM_TYPE_NOTHING:
				callback([]);
				break;
				
			case module.ITEM_TYPE_BUCKET:
				itemDelta = [];
				// TODO
				break;
				
			case module.ITEM_TYPE_CREDITS:
				PlayerDAO().getPlayer(plrId, function(playerRecord) {
					playerRecord['credits'] += quantity;
					
					PlayerDAO().updatePlayer(playerRecord, function() {
						callback(itemDelta);
					});
				});
				break;
				
			default:
				console.log("Item type " + itemType + " not recognized");
				break;
		}
	};
	
	return module;
};
