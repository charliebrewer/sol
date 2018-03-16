var PlayerShipsDAO = require('../models/PlayerShipsDAO');

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
	
	module.modifyActiveShipCargo = function(plrId, itemType, itemId, itemQuantity, callback) {
		PlayerShipsDAO().getPlayerShips(plrId, function(plrShips) {
			var activeShip = plrShips.find(e => 1 == e['is_active']);
			
			if(undefined == activeShip) {
				console.log("Tried to modify player's ship cargo, doesn't have an active ship.");
				callback(false);
				return;
			}
			
			activeShip['cargo'] = ShipMechanics().modifyShipCargo(activeShip['cargo'], itemType, itemId, itemQuantity);
			
			PlayerShipsDAO().storePlayerShip(activeShip, function() {
				callback(true);
			});
		});
	};
	
	return module;
};
