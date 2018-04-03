var DefBucketItemsDAO = require('../models/DefBucketItemsDAO');
var PlayerDAO = require('../models/PlayerDAO');
var PlayerShipsDAO = require('../models/PlayerShipsDAO');

var PlayerController = require('../controllers/PlayerController');
var ShipController = require('../controllers/ShipController');

var PlayerUtil = require('./PlayerUtil');
var ShipUtil = require('./ShipUtil');

var BucketMechanics = require('../helpers/BucketMechanics');

var Logger = require('../helpers/Logger');

module.exports = function() {
	var module = {};
	
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
		 * Calls back with a bucket of items that were given to the player.
		 */
		item.giveToPlayer = function(dataBox, callback) {callback(BucketMechanics().createEmptyBucket());};
		item.takeFromPlr = function(dataBox, plrId, callback) {callback(BucketMechanics().createEmptyBucket());};
		
		/**
		 * Calls back with an integer representing the amount of this item
		 * that a player possesses.
		 */
		item.getPlrQuantity = function(dataBox, callback) {callback(0);};
		
		item.canGive = function(dataBox, plrId, callback) {callback(true);};
		item.canTake = function(dataBox, plrId, callback) {callback(true);};
		
		switch(itemType) {
			case BucketMechanics().ITEM_TYPE_NOTHING:
				item.name = "Nothing";
				break;
			
			case BucketMechanics().ITEM_TYPE_BUCKET:
				item.name = "Bucket";
				
				item.giveToPlayer = function(dataBox, callback) {
					DefBucketItemsDAO().getBucketItems(dataBox, item.itemId, function(defBucketItems) {
						// TODO temp hack while def buckets hasn't been set up
						var defBucket = {'bucket_id':item.itemId, 'name':'Bucket'};
						
						var bucket = BucketMechanics().createBucketFromDef(defBucket, defBucketItems);
						
						module.giveBucketToPlr(dataBox, bucket, function(flatBucket) {
							callback(flatBucket);
						});
					});
				};
				
				item.getPlrQuantity = function(dataBox, callback) {
					Logger().log(Logger().NORMAL, "Trying to get quantity of a bucket that the player has");
					Logger().log(Logger().NORMAL, console.trace());
					callback(0);
				};
				
				break;
			
			case BucketMechanics().ITEM_TYPE_CREDITS:
				item.name = "Credits";
				
				item.giveToPlayer = function(dataBox, callback) {
					PlayerUtil().modifyPlayerCredits(dataBox, item.quantity, true, function(creditDelta) {
						var itemsGiven = BucketMechanics().createEmptyBucket();
						itemsGiven.setAllowNegatives(true);
						
						itemsGiven.modifyContents(BucketMechanics().ITEM_TYPE_CREDITS, 0, creditDelta);
						
						callback(itemsGiven);
					});
				};
				
				item.getPlrQuantity = function(dataBox, callback) {
					PlayerDAO().getPlayer(dataBox, dataBox.getPlrId(), function(playerRecord) {
						callback(playerRecord['credits']);
					});
				};
				
				break;
			
			case BucketMechanics().ITEM_TYPE_SHIP:
				item.name = "Ship";
				
				if(item.quantity > 0)
					item.quantity = 1;
				else
					item.quantity = -1;
				
				item.giveToPlayer = function(dataBox, callback) {
					ShipUtil().modifyPlayerShips(dataBox, item.itemId, item.quantity > 0, function(res) {
						var itemsGiven = BucketMechanics().createEmptyBucket();
						itemsGiven.setAllowNegatives(true);
						
						if(res)
							itemsGiven.modifyContents(BucketMechanics().ITEM_TYPE_SHIP, item.itemId, item.quantity);
						
						callback(itemsGiven);
					});
				};
				
				item.getPlrQuantity = function(dataBox, callback) {
					PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
						var ship = plrShips.find(e => e['def_ship_id'] == item.itemId && 0 == (e['flags'] & PlayerShipsDAO().FLAG_SOLD));
						if(undefined == ship)
							callback(0);
						else
							callback(1);
					});
				};
				
				break;
			
			case BucketMechanics().ITEM_TYPE_COMMODITY:
				item.name = "Commodity";
				
				item.giveToPlayer = function(dataBox, callback) {
					var bucketToAdd = BucketMechanics().createEmptyBucket();
					bucketToAdd.setAllowNegatives(true);
					
					bucketToAdd.modifyContents(item.itemType, item.itemId, item.quantity);
					
					ShipUtil().modifyActiveShipCargo(dataBox, bucketToAdd, function(success) {
						if(success)
							callback(bucketToAdd);
						else
							callback(BucketMechanics().createEmptyBucket());
					});
				};
				
				item.getPlrQuantity = function(dataBox, callback) {
					PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
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
				
			case BucketMechanics().ITEM_TYPE_SHIP_MODULE:
				item.giveToPlayer = function(dataBox, callback) {
					Logger().log(Logger().ERROR, "Attempting to give a module via ItemUtil");
					return(BucketMechanics().createEmptyBucket());
				};
				
				item.getPlrQuantity = function(dataBox, callback) {
					// Get player's ships, and their active ship cargo
					var sum = 0;
					var cargoBucket;
					
					PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
						plrShips.forEach(function(plrShip) {
							cargoBucket = BucketMechanics().createBucketFromString(plrShip['cargo']);
							sum += cargoBucket.getItemQuantity(item.itemType, item.itemId);
							
							plrShip['loadout'].split(',').forEach(function(moduleId) {
								if(moduleId == item.itemId)
									sum++;
							});
						});
						
						callback(sum);
					});
				};
				
				break;
			
			default:
				// TODO throw err
				Logger().log(Logger().NORMAL, "Item type " + itemType + " not recognized");
				break;
		}
		
		return item;
	};
	
	/**
	 * Function to take a bucket and ensure it contains no child buckets.
	 * Each child bucket found will have its contents added to the base bucket.
	 * bucket contents so that it will not contain any further buckets.
	 *
	 * Warning - this function will fail if you have bucket that contains a loop
	 * such as a bucket containing itself. Don't do that.
	 */
	module.flattenBucket = function(dataBox, bucket, callback) {
		var seenBuckets = [];
		
		// Gather all bucket IDs into an array
		bucket.forEachItem(function(itemType, itemId, itemQuantity) {
			if(BucketMechanics().ITEM_TYPE_BUCKET == itemType) {
				for(let i = 0; i < itemQuantity; i++) {
					seenBuckets.push(itemId);
				}
			}
		});
		
		// If we didn't find any buckets just return
		if(0 == seenBuckets.length) {
			callback(bucket);
			return;
		}
		
		var bucketsAdded = 0;
		
		// Remove all the buckets we gathered from the parent bucket
		seenBuckets.forEach(function(bucketId) {
			bucket.removeItem(BucketMechanics().ITEM_TYPE_BUCKET, bucketId);
		});
		
		// Add the bucket contents to our parent bucket
		seenBuckets.forEach(function(bucketId) {
			DefBucketItemsDAO().getBucketItems(dataBox, bucketId, function(defBucketItems) {
				// TODO temp hack while def buckets hasn't been set up
				var defBucket = {'bucket_id':itemId, 'name':'Bucket'};
				
				bucket.addBucketContents(BucketMechanics().createBucketFromDef(defBucket, defBucketItems));
				
				bucketsAdded++;
				
				if(bucketsAdded == seenBuckets.length) {
					// We try to flatten the bucket again in case any of the buckets we just added contain a bucket
					module.flattenBucket(dataBox, bucket, callback);
				}
			});
		});
	};
	
	module.giveBucketToPlr = function(dataBox, bucket, callback) {
		module.flattenBucket(dataBox, bucket, function(flatBucket) {
			var sum = flatBucket.itemQuantitySum();
			
			flatBucket.forEachItem(function(itemType, itemId, itemQuantity) {
				module.getItem(itemType, itemId, itemQuantity).giveToPlayer(dataBox, function() {
					sum -= itemQuantity;
					
					if(0 == sum)
						callback(flatBucket);
				});
			});
		});
	};
	
	module.canGiveBucketToPlr = function(dataBox, plrId, bucket, callback) {
		module.flattenBucket(dataBox, bucket, function(flatBucket) {
			var sum = flatBucket.itemQuantitySum();
			
			if(0 == sum) {
				callback(true);
				return;
			}
			
			flatBucket.forEachItem(function(itemType, itemId, itemQuantity) {
				module.getItem(itemType, itemId, itemQuantity).canGive(dataBox, plrId, function(canGive) {
					if(!canGive) {
						callback(false);
					} else {
						sum -= itemQuantity;
						
						if(0 >= sum)
							callback(true);
					}
				});
			});
		});
	};
	
	return module;
};
