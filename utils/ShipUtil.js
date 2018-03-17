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
	module.modifyPlayerShips = function(plrId, defShipId, giveNotTake, timeMs, callback) {
		PlayerShipsDAO().getPlayerShips(plrId, function(plrShips) {
			var ship = plrShips.find(e => e['def_ship_id'] == defShipId);
			
			if(undefined == ship) {
				if(!giveNotTake) {
					Logger().log(Logger().NORMAL, "Trying to take ship " + defShipId + " from player " + plrId + " but they don't have it");
					callback(false);
					return;
				}
				
				var ship = {};
			} else { // Ship is defined
				if(giveNotTake && 0 == (ship['flags'] && PlayerShipsDAO().FLAG_SOLD)) {
					Logger().log(Logger().NORMAL, "Trying to give ship " + defShipId + " to player " + plrId + " but they already have it");
					callback(false);
					return;
				} else if(!giveNotTake && 0 != (ship['flags'] && PlayerShipsDAO().FLAG_SOLD)) {
					Logger().log(Logger().NORMAL, "Trying to take ship " + defShipId + " from player " + plrId + " but it has been sold");
					callback(false);
					return;
				}
			}
			
			ship['plr_id'] = plrId;
			ship['def_ship_id'] = defShipId;
			ship['loadout'] = {};
			ship['cargo'] = '{}';
			ship['location_type'] = NavigationMechanics().LOCATION_TYPE_UNKNOWN;
			ship['location_id'] = 0;
			ship['is_active'] = 0;
			
			if(giveNotTake)
				ship['flags'] = 0;
			else if(undefined != ship['flags'])
				ship['flags'] = ship['flags'] | PlayerShipsDAO().FLAG_SOLD;
			else
				ship['flags'] = PlayerShipsDAO().FLAG_SOLD;
			
			PlayerShipsDAO().storePlayerShip(ship, function(res) {
				callback(true);
			});
		});
	};
	
	module.modifyActiveShipCargo = function(plrId, itemType, itemId, itemQuantity, callback) {
		PlayerShipsDAO().getPlayerShips(plrId, function(plrShips) {
			var activeShip = plrShips.find(e => 1 == e['is_active']);
			
			if(undefined == activeShip) {
				Logger().log(Logger().NORMAL, "Tried to modify player's ship cargo, doesn't have an active ship.");
				callback(false);
				return;
			}
			
			var cargo = module.createBucketFromString(activeShip['cargo']);
			
			cargo.modifyContents(itemType, itemId, itemQuantity);
			
			activeShip['cargo'] = cargo.getItemsString();
			
			PlayerShipsDAO().storePlayerShip(activeShip, function() {
				callback(true);
			});
		});
	};
	
	module.changeShips = function(plrId, activePlrShipId, callback) {};
	
	return module;
};
