var ShipMechanics = require('../helpers/ShipMechanics');

module.exports = function() {
	var module = {};
	
	module.getPlayerShips = function(plrIr, callback) { return []; };
	
	/**
	 * Function to give or take a ship from a player.
	 *
	 * @return bool If the player's ship inventory was modified.
	 */
	module.modifyPlayerShips = function(plrId, shipDefId, quantity, callback) { return false; };
		
	module.getShipMobility = function(plrShipId, callback) {
		callback(ShipMechanics().calcShipMobility(1, 1));
	};
	
	return module;
};
