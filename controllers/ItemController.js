var PlayerController = require('./PlayerController');

module.exports = function() {
	var module = {};
	
	module.ITEM_TYPE_NOTHING   = 0;
	module.ITEM_TYPE_BUCKET    = 1;
	module.ITEM_TYPE_CREDITS   = 2;
	/*
	SHIP
	COMMODITY
	MODULE
	*/
	
	module.giveItemToPlayer = function(plrId, itemType, itemId, quantity, callback) {
		var itemDelta = {};
		
		switch(itemType) {
			case module.ITEM_TYPE_NOTHING:
				break;
			default:
				console.log("Item type " + itemType + " not recognized");
				break;
		}
		
		callback(itemDelta);
	};
	
	return module;
};
