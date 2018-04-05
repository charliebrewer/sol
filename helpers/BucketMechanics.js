module.exports = function() {
	var module = {};
	
	module.ITEM_TYPE_NOTHING     = 0;
	module.ITEM_TYPE_BUCKET      = 1;
	module.ITEM_TYPE_CREDITS     = 2;
	module.ITEM_TYPE_SHIP        = 3;
	module.ITEM_TYPE_COMMODITY   = 4;
	module.ITEM_TYPE_SHIP_MODULE = 5;
	
	module.createBucketFromDef = function(defBucket, defBucketItems) {
		var bucket = module.createEmptyBucket();
		
		bucket.id = defBucket['bucket_id'];
		bucket.name = defBucket['name'];
		
		defBucketItems.forEach(function(defBucketItem) {
			if(defBucketItem['bucket_id'] != defBucket['bucket_id'])
				console.log("Bucket item bucket id " + defBucketItem['bucket_id'] + " doesn't match def bucket id " + defBucket['bucket_id']);
			else
				bucket.modifyContents(defBucketItem['item_type'], defBucketItem['item_id'], defBucketItem['item_quantity']);
		});
		
		return bucket;
	};
	
	module.createBucketFromString = function(bucketItemsJson) {
		var bucket = module.createEmptyBucket();
		
		var bucketItems = JSON.parse(bucketItemsJson);
		
		// This logic is duplicated in bucket.forEachItem, but I didn't want to
		// hack a bucket together to be able to iterate over its items
		Object.getOwnPropertyNames(bucketItems).forEach(function(itemType) {
			Object.getOwnPropertyNames(bucketItems[itemType]).forEach(function(itemId) {
				bucket.modifyContents(itemType, itemId, bucketItems[itemType][itemId]);
			});
		});
		
		return bucket;
	};
	
	module.createBucketFromBucket = function(bucket) {
		var copy = module.createEmptyBucket();
		
		copy.id = bucket.id;
		copy.name = bucket.name;
		copy.allowNegatives = bucket.allowNegatives;
		
		bucket.forEachItem(function(itemType, itemId, itemQuantity) {
			copy.modifyContents(itemType, itemId, itemQuantity);
		});
		
		return copy;
	};
	
	module.createEmptyBucket = function() {
		var bucket = {};
		
		bucket.id = 0;
		bucket.name = "Bucket";
		bucket.allowNegatives = false;
		bucket.items = {};
		
		/**
		 * The primary way that a bucket's contents are modified. This will
		 * potentially fail when adding negative quantities.
		 *
		 * @return bool If the bucket was modified or not.
		 */
		bucket.modifyContents = function(itemType, itemId, itemQuantity) {
			itemType     = parseInt(itemType).toString();
			itemId       = parseInt(itemId).toString();
			itemQuantity = parseInt(itemQuantity);
			
			if(0 == itemQuantity)
				return false;
			
			if(0 < itemQuantity || bucket.allowNegatives) {
				if(!Object.getOwnPropertyNames(bucket.items).includes(itemType))
					bucket.items[itemType] = {};
				
				if(!Object.getOwnPropertyNames(bucket.items[itemType]).includes(itemId))
					bucket.items[itemType][itemId] = 0;
			} else {
				if(!Object.getOwnPropertyNames(bucket.items).includes(itemType))
					return false;
				
				if(!Object.getOwnPropertyNames(bucket.items[itemType]).includes(itemId))
					return false;
			}
			
			if(0 > (bucket.items[itemType][itemId] + itemQuantity) && !bucket.allowNegatives)
				return false;
			
			bucket.items[itemType][itemId] += itemQuantity;
			
			if(0 == bucket.items[itemType][itemId])
				bucket.removeItem(itemType, itemId);
			
			return true;
		};
		
		bucket.addBucketContents = function(otherBucket) {
			otherBucket.forEachItem(function(itemType, itemId, itemQuantity) {
				bucket.modifyContents(itemType, itemId, itemQuantity);
			});
		};
		
		/**
		 * Removes ALL of a given item from this bucket.
		 *
		 * @return bool If an item was removed.
		 */
		bucket.removeItem = function(itemType, itemId) {
			var retVal = false;
			
			if(undefined != bucket.items[itemType]) {
				if(undefined != bucket.items[itemType][itemId]) {
					delete bucket.items[itemType][itemId];
					retVal = true;
				}
				
				if(0 == Object.getOwnPropertyNames(bucket.items[itemType]).length) {
					delete bucket.items[itemType];
					retVal = true;
				}
			}
			
			return retVal;
		};
		
		bucket.getItemQuantity = function(itemType, itemId) {
			if(undefined != bucket.items[itemType]) {
				if(undefined != bucket.items[itemType][itemId]) {
					return bucket.items[itemType][itemId];
				}
			}
			
			return 0;
		};
		
		/**
		 * Function to iterate of the contents of this bucket. Calls callback
		 * with itemType, itemId, and itemQuantity parameters.
		 */
		bucket.forEachItem = function(callback) {
			Object.getOwnPropertyNames(bucket.items).forEach(function(itemType) {
				Object.getOwnPropertyNames(bucket.items[itemType]).forEach(function(itemId) {
					callback(itemType, itemId, bucket.items[itemType][itemId]);
				});
			});
		};
		
		bucket.setAllowNegatives = function(allow) {
			if(allow) {
				bucket.allowNegatives = true;
			} else {
				// Need to clean out negative values, create a copy so we can iterate over the items cleanly
				var copy = module.createBucketFromBucket(bucket);
				
				copy.forEachItem(function(itemType, itemId, itemQuantity) {
					if(0 >= itemQuantity)
						bucket.removeItem(itemType, itemId);
				});
				
				bucket.allowNegatives = false;
			}
		};
		
		/**
		 * Sums the quantities of all items or just the items that have a type
		 * which is contained in the itemTypeArr parameter.
		 */
		bucket.itemQuantitySum = function(itemTypeArr = null) {
			var sum = 0;
			
			bucket.forEachItem(function(itemType, itemId, itemQuantity) {
				if(null == itemTypeArr || itemTypeArr.includes(itemType))
					sum += itemQuantity;
			});
			
			return sum;
		};
		
		bucket.numUniqueItems = function() {
			var sum = 0;
			
			bucket.forEachItem(function(itemType, itemId, itemQuantity) {
				sum++;
			});
			
			return sum;
		};
		
		/**
		 * Function to generate the JSON object associated with this bucket's
		 * contents. Does not encapsulate the other properties of the bucket.
		 * The output of this function should be what is passed into the
		 * createBucketFromString constructor.
		 */
		bucket.getItemsString = function() {
			return JSON.stringify(bucket.items);
		};
		
		return bucket;
	};
	
	return module;
};
