var PlayerShipsDAO = require('../models/PlayerShipsDAO');

var ShipMechanics = require('../helpers/ShipMechanics');

module.exports = function() {
	var module = {};
	
	module.getPlayerShips = function(plrIr, callback) { return []; };
		
	module.getShipMobility = function(plrShipId, callback) {
		callback(ShipMechanics().calcShipMobility(1, 1));
	};
	
	return module;
};
