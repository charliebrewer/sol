module.exports = function() {
	var module = {};
	
	/**
	 * Get the mobility of a ship based on its mass and thrust.
	 *
	 * @return Int
	 */
	module.calcShipMobility = function(mass, thrust) {
		return thrust / mass;
	};
	
	/**
	 * Function to manage a ship's cargo as a JSON object. Takes in an existing
	 * cargo and adds or subtracts cargo from it, and returns the resulting cargo.
	 */
	module.modifyShipCargo = function(cargo, itemType, itemId, itemQuantity) {
		itemType     = parseInt(itemType).toString();
		itemId       = parseInt(itemId).toString();
		itemQuantity = parseInt(itemQuantity);
		
		if(0 == itemQuantity)
			return cargo;
		
		if(!Object.getOwnPropertyNames(cargo).includes(itemType)) {
			if(0 > itemQuantity)
				return cargo; // It doesn't have this item type and we're subtracting, bye
			else
				cargo[itemType] = {};
		}
		
		if(!Object.getOwnPropertyNames(cargo[itemType]).includes(itemId)) {
			if(0 > itemQuantity)
				return cargo; // It doesn't have this item id and we're subtracting, bye
			else
				cargo[itemType][itemId] = 0;
		}
		
		cargo[itemType][itemId] += itemQuantity;
		
		if(0 >= cargo[itemType][itemId]) {
			delete cargo[itemType][itemId];
			
			if(0 == Object.getOwnPropertyNames(cargo[itemType]).length)
				delete cargo[itemType];
		}
		
		return cargo;
	};
	
	return module;
};
