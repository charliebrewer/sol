var PlayerShipsDAO = require('../models/PlayerShipsDAO');

var PlayerController = require('../controllers/PlayerController');
var ShipController = require('../controllers/ShipController');

var ShipUtil = require('./ShipUtil');

var BucketMechanics = require('../helpers/BucketMechanics');

var Logger = require('../helpers/Logger');

module.exports = function() {
	var module = {};
	
	// TODO remove this, it has been moved to BucketMechanics
	module.ITEM_TYPE_NOTHING   = 0;
	module.ITEM_TYPE_BUCKET    = 1;
	module.ITEM_TYPE_CREDITS   = 2;
	module.ITEM_TYPE_SHIP      = 3;
	module.ITEM_TYPE_COMMODITY = 4;
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
		item.giveToPlayer = function(plrId, timeMs, callback) {callback([])};
		
		/**
		 * Calls back with an integer representing the amount of this item
		 * that a player possesses.
		 */
		item.getPlrQuantity = function(plrId, timeMs, callback) {callback(0)};
		
		switch(itemType) {
			case module.ITEM_TYPE_NOTHING:
				item.name = "Nothing";
				break;
			
			case module.ITEM_TYPE_BUCKET:
				item.name = "Bucket";
				// TODO
				break;
			
			case module.ITEM_TYPE_CREDITS:
				item.name = "Credits";
				
				item.giveToPlayer = function(plrId, timeMs, callback) {
					PlayerController().modifyPlayerCredits(plrId, this.quantity, true, function(creditDelta) {
						callback([module.getItem(module.ITEM_TYPE_CREDITS, 0, creditDelta)]);
					});
				};
				
				item.getPlrQuantity = function(plrId, timeMs, callback) {
					PlayerController().getPlayerRecord(plrId, function(playerRecord) {
						callback(playerRecord['credits']);
					});
				};
				
				break;
			
			case module.ITEM_TYPE_SHIP:
				item.name = "Ship";
				
				item.giveToPlayer = function(plrId, timeMs, callback) {
					ShipUtil().modifyPlayerShips(plrId, item.itemId, item.quantity > 0, timeMs, function(res) {
						if(res)
							callback([this]);
						else
							callback([]);
					});
				};
				
				item.getPlrQuantity = function(plrId, timeMs, callback) {
					PlayerShipsDAO().getPlayerShips(plrId, function(plrShips) {
						var ship = plrShips.find(e => e['def_ship_id'] == item.itemId && 0 == (e['flags'] & PlayerShipsDAO().FLAG_SOLD));
						if(undefined == ship)
							callback(0);
						else
							callback(1);
					});
				};
				
				break;
			
			case module.ITEM_TYPE_COMMODITY:
				item.name = "Commodity";
				
				item.giveToPlayer = function(plrId, timeMs, callback) {
					ShipUtil().modifyActiveShipCargo(plrId, item.itemType, item.itemId, item.quantity, function(success) {
						callback([]); // TODO
					});
				};
				
				item.getPlrQuantity = function(plrId, timeMs, callback) {
					PlayerShipsDAO().getPlayerShips(plrId, function(plrShips) {
						var activeShip = plrShips.find(e => 1 == e['is_active']);
						
						if(undefined == activeShip) {
							callback(0);
							return;
						}
						
						var shipCargo = BucketMechanics().createBucketFromString(activeShip['cargo']);
						callback(shipCargo.getItemQuantity(item.itemType, item.itemId));
					});
				};
				
				break;
			
			default:
				// TODO throw err
				console.log("Item type " + itemType + " not recognized");
				break;
		}
		
		return item;
	};
	
	/**
	 * Function to take a bucket and ensure it contains no child buckets.
	 * Each child bucket found will have its contents added to the base bucket.
	 * bucket contents so that it will not contain any further buckets.
	 */
	module.flatenBucket = function(bucket, callback) {
		var seenBuckets = [];
		
		bucket.forEachItem(function(itemType, itemId, itemQuantity) {
			if(BucketMechanics().ITEM_TYPE_BUCKET == itemType) {
				if(seenBuckets.includes(itemId)) {
					Logger().log(Logger().NORMAL, "Bucket " + bucket.id + " is trying to include bucket " + itemId + " twice");
					return;
				}
				
				if(0 != itemId)
					seenBuckets.push(itemId);
				
				// TODO get bucket info from DefBucketDAO
				//bucket.addBucketContents(otherBucket);
			}
		});
		
		callback(bucket);
	};
	
	return module;
};
