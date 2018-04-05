const DefBucketItemsDAO = require('../models/DefBucketItemsDAO');

const BucketMechanics = require('../helpers/BucketMechanics');

const ItemTypeCommodity = require('./items/ItemTypeCommodity');
const ItemTypeCredits = require('./items/ItemTypeCredits');
const ItemTypeShip = require('./items/ItemTypeShip');
const ItemTypeShipModule = require('./items/ItemTypeShipModule');

const Logger = require('../helpers/Logger');

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
		
		if(isNaN(itemType) || isNaN(itemId) || isNaN(quantity))
			throw "Invalid item created";
		
		if(0 > quantity)
			throw "Trying to get an item with negative quantity";
		
		var item = {};
		
		item.itemType = itemType;
		item.itemId   = itemId;
		item.quantity = quantity;
		item.name     = 'Item';
		
		item.toString = function() {
			return "Type: " + this.itemType + " ID: " + this.itemId + " Num: " + this.quantity + " Name: " + this.name;
		};
		
		/**
		 * Gives this item to player plrId.
		 *
		 * Calls back with a bucket of items that were given to the player.
		 */
		item.give = function(dataBox, plrId, callback) {callback(BucketMechanics().createEmptyBucket());};
		item.take = function(dataBox, plrId, callback) {callback(BucketMechanics().createEmptyBucket());};
		
		/**
		 * Calls back with an integer representing the amount of this item
		 * that a player possesses.
		 */
		item.getNum = function(dataBox, callback) {callback(0);};
		
		/**
		 * Test functions to see if the player can accept this item.
		 */
		item.canGive = function(dataBox, plrId, callback) {callback(true);};
		item.canTake = function(dataBox, plrId, callback) {callback(true);};
		
		switch(itemType) {
			case BucketMechanics().ITEM_TYPE_NOTHING:
				item.name = "Nothing";
				break;
			
			case BucketMechanics().ITEM_TYPE_BUCKET:
				// We don't create a separate bucket giver class because buckets and ItemUtil are so closely related
				item.name = "Bucket";
				
				item.give = function(dataBox, plrId, callback, give = true) {
					DefBucketItemsDAO().getBucketItems(dataBox, item.itemId, function(defBucketItems) {
						// TODO temp hack while def buckets hasn't been set up
						var defBucket = {bucket_id : item.itemId, name : item.name};
						
						var bucket = BucketMechanics().createBucketFromDef(defBucket, defBucketItems);
						
						if(give) {
							module.giveBucketToPlr(dataBox, bucket, function(flatBucket) {
								callback(flatBucket);
							});
						} else {
							module.takeBucketFromPlr(dataBox, bucket, function(flatBucket) {
								callback(flatBucket);
							});
						}
					});
				};
				
				item.take = function(dataBox, plrId, callback) {
					item.give(dataBox, plrId, callback, false);
				};
				
				item.getNum = function(dataBox, plrId, callback) {
					Logger().log(Logger().ERROR, "Trying to get quantity of a bucket that the player has");
					Logger().log(Logger().ERROR, console.trace());
					callback(0);
				};
				
				item.canGive = function(dataBox, plrId, callback, give = true) {
					DefBucketItemsDAO().getBucketItems(dataBox, item.itemId, function(defBucketItems) {
						var defBucket = {'bucket_id':item.itemId, 'name':item.name};
						
						var bucket = BucketMechanics().createBucketFromDef(defBucket, defBucketItems);
						
						if(give)
							module.canGiveBucketToPlr(dataBox, plrId, bucket, callback);
						else
							module.canTakeBucketFromPlr(dataBox, plrId, bucket, callback);
					});
				};
				
				item.canTake = function(dataBox, plrId, callback) {
					item.canGive(dataBox, plrId, callback, false);
				};
				
				break;
			
			case BucketMechanics().ITEM_TYPE_CREDITS:
				ItemTypeCredits().decorate(item);
				break;
			
			case BucketMechanics().ITEM_TYPE_SHIP:
				ItemTypeShip().decorate(item);
				break;
			
			case BucketMechanics().ITEM_TYPE_COMMODITY:
				ItemTypeCommodity().decorate(item);
				break;
				
			case BucketMechanics().ITEM_TYPE_SHIP_MODULE:
				ItemTypeShipModule().decorate(item);
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
	
	module.giveBucketToPlr = function(dataBox, plrId, bucket, callback, give = true) {
		module.flattenBucket(dataBox, bucket, function(flatBucket) {
			var sum = flatBucket.numUniqueItems();
			
			var cb = function() {
				sum--;
				
				if(0 == sum)
					callback(flatBucket);
			}
			
			flatBucket.forEachItem(function(itemType, itemId, itemQuantity) {
				if(give)
					module.getItem(itemType, itemId, itemQuantity).give(dataBox, plrId, cb);
				else
					module.getItem(itemType, itemId, itemQuantity).take(dataBox, plrId, cb);
			});
		});
	};
	
	module.takeBucketFromPlr = function(dataBox, plrId, bucket, callback) {
		module.giveBucketToPlr(dataBox, plrId, bucket, callback, false);
	};
	
	module.canGiveBucketToPlr = function(dataBox, plrId, bucket, callback, give = true) {
		module.flattenBucket(dataBox, bucket, function(flatBucket) {
			var sum = flatBucket.numUniqueItems();
			
			if(0 == sum) {
				callback(true);
				return;
			}
			
			var retVal = true;
			
			var cb = function(can) {
				if(!can)
					retVal = false;
				
				sum--;
				
				if(0 == sum)
					callback(retVal);
			};
			
			flatBucket.forEachItem(function(itemType, itemId, itemQuantity) {
				if(give)
					module.getItem(itemType, itemId, itemQuantity).canGive(dataBox, plrId, cb);
				else
					module.getItem(itemType, itemId, itemQuantity).canTake(dataBox, plrId, cb);
			});
		});
	};
	
	module.canTakeBucketFromPlr = function(dataBox, plrId, bucket, callback) {
		module.canGiveBucketToPlr(dataBox, plrId, bucket, callback, false);
	};
	
	return module;
};
