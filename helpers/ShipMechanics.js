var BucketMechanics = require('./BucketMechanics');

module.exports = function() {
	var module = {};
	
	/**
	 * Array of item types that are stored in a ship's cargo.
	 */
	module.cargoItemTypes = [
		BucketMechanics().ITEM_TYPE_COMMODITY
	];
	
	/**
	 * Get the mobility of a ship based on its mass and thrust.
	 *
	 * @return Int
	 */
	module.calcShipMobility = function(mass, thrust) {
		return thrust / mass;
	};
	
	module.cargoAcceptsItemType = function(itemType) {
		 return module.cargoItemTypes.includes(itemType);
	};
	
	module.getCargoCapacity = function(plrShip) {
		// TODO look at the ship loadout and calculate the total storage capacity of this ship
	};
	
	return module;
};
