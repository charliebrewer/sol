var Logger = require('../helpers/Logger');

var PlayerShipsDAO = require('../models/PlayerShipsDAO');

var BucketMechanics = require('../helpers/BucketMechanics');
var NavigationMechanics = require('../helpers/NavigationMechanics');

module.exports = function() {
	var module = {};

	/**
	 * Function to give or take a ship from a player. This gives the ship to
	 * the player at an unspecified location, that should be defined elsewhere.
	 *
	 * @return bool If the player's ship inventory was modified.
	 */
	module.modifyPlayerShips = function(dataBox, defShipId, giveNotTake, callback) {
		PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
			var ship = plrShips.find(e => e['def_ship_id'] == defShipId);
			
			if(undefined == ship) {
				if(!giveNotTake) {
					Logger().log(Logger().NORMAL, "Trying to take ship " + defShipId + " from player " + dataBox.getPlrId() + " but they don't have it");
					callback(false);
					return;
				}
				
				var ship = PlayerShipsDAO().newRow(dataBox.getPlrId(), defShipId, plrShips);
			} else { // Ship is defined
				if(giveNotTake && 0 == (ship['flags'] && PlayerShipsDAO().FLAG_SOLD)) {
					Logger().log(Logger().NORMAL, "Trying to give ship " + defShipId + " to player " + dataBox.getPlrId() + " but they already have it");
					callback(false);
					return;
				} else if(!giveNotTake && 0 != (ship['flags'] && PlayerShipsDAO().FLAG_SOLD)) {
					Logger().log(Logger().NORMAL, "Trying to take ship " + defShipId + " from player " + dataBox.getPlrId() + " but it has been sold");
					callback(false);
					return;
				}
			}
			
			if(!giveNotTake)
				ship['flags'] = ship['flags'] | PlayerShipsDAO().FLAG_SOLD;
			
			PlayerShipsDAO().storePlayerShip(dataBox, ship, function(res) {
				callback(true);
			});
		});
	};
	
	module.modifyActiveShipCargo = function(dataBox, bucketToAdd, callback) {
		PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
			var activeShip = plrShips.find(e => 1 == e['is_active']);
			
			if(undefined == activeShip) {
				Logger().log(Logger().NORMAL, "Tried to modify player's ship cargo, doesn't have an active ship.");
				callback(false);
				return;
			}
			
			var cargo = BucketMechanics().createBucketFromString(activeShip['cargo']);
			
			cargo.addBucketContents(bucketToAdd);
			
			activeShip['cargo'] = cargo.getItemsString();
			
			PlayerShipsDAO().storePlayerShip(dataBox, activeShip, function() {
				callback(true);
			});
		});
	};
	
	module.changeShips = function(plrId, activePlrShipId, callback) {};
	
	return module;
};
