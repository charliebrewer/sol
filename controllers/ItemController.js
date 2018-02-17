var PlayerController = require('./PlayerController');

module.exports = function() {
	var module = {};
	
	module.ITEM_TYPE_NOTHING   = 0;
	module.ITEM_TYPE_BUCKET    = 1;
	module.ITEM_TYPE_CREDITS   = 2;
	module.ITEM_TYPE_SHIP      = 3;
	/*
	COMMODITY
	MODULE
	etc
	*/
	
	/**
	 * Creates a generic item that contains a number of abstracted properties
	 * and functions. This is the primary way that items should be given and
	 * taken from players.
	 */
	module.getItem = function(itemType, itemId, quantity) {
		itemType = parseInt(itemType);
		itemId   = parseInt(itemId);
		quantity = parseInt(quantity);
		
		var item = {};
		
		item.itemType = itemType;
		item.itemId   = itemId;
		item.quantity = quantity;
		item.name     = '';
		
		item.toString = function() {
			return "Type: " + this.itemType + " ID: " + this.itemId + " Num: " + this.quantity + " Name: " + this.name;
		};
		
		/**
		 * Gives this item to player plrId.
		 *
		 * Calls back with an array of items representing what was given to the player.
		 */
		item.giveToPlayer = function(plrId, callback) {callback([])};
		
		/**
		 * Calls back with an integer representing the amount of this item
		 * that a player possesses.
		 */
		item.numPlayerHas = function(plrId, callback) {callback(0)};
		
		switch(itemType) {
			case module.ITEM_TYPE_NOTHING:
				item.name = "Nothing";
				break;
			
			case module.ITEM_TYPE_BUCKET:
				item.name = "Bucket"; // Should be name of bucket definition
				// TODO
				break;
			
			case module.ITEM_TYPE_CREDITS:
				item.name = "Credits";
				
				item.giveToPlayer = function(plrId, callback) {
					PlayerController().modifyPlayerCredits(plrId, this.quantity, true, function(creditDelta) {
						callback([module.getItem(module.ITEM_TYPE_CREDITS, 0, creditDelta)]);
					});
				};
				
				item.numPlayerHas = function(plrId, callback) {
					PlayerController().getPlayerRecord(plrId, function(playerRecord) {
						callback(playerRecord['credits']);
					});
				};
				
				break;
			
			case module.ITEM_TYPE_SHIP:
				item.name = "Ship"; // Should be name of the ship
				// TODO
				break;
			
			default:
				// TODO throw err
				console.log("Item type " + itemType + " not recognized");
				break;
		}
		
		return item;
	};
	
	/**
	 * Function to determine the contents of a bucket. Parses and collates
	 * bucket contents so that it will not contain any further buckets.
	 */
	module.getBucketContents = function(bucketId, callback) {
		// TODO
		callback([]);
	};
	
	return module;
};
