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
	
	return module;
};
