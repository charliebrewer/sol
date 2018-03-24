var PlayerDAO = require('../models/PlayerDAO');
var PlayerShipsDAO = require('../models/PlayerShipsDAO');

var NavigationMechanics = require('../helpers/NavigationMechanics');
var ShipMechanics = require('../helpers/ShipMechanics');

var Logger = require('../helpers/Logger');

module.exports = function() {
	var module = {};
	
	module.getShipMobility = function(plrShipId, callback) {
		callback(ShipMechanics().calcShipMobility(1, 1));
	};
	
	module.setActiveShip = function(dataBox, input, output, callback) {
		if(undefined == input.plrShipId) {
			output.messages.push("Invalid input");
			callback(output);
			return;
		}
		
		PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
			var plrShip = plrShips.find(e => e['plr_ship_id'] == input.plrShipId && 0 == (PlayerShipsDAO().FLAG_SOLD & e['flags']));
			
			if(undefined == plrShip) {
				Logger().log(Logger().NORMAL, "Player " + dataBox.getPlrId() + " is trying to set a active ship that they don't have");
				callback(output);
				return;
			}
			
			PlayerDAO().getPlayer(dataBox, dataBox.getPlrId(), function(plrRecord) {
				if(plrRecord['location_type'] != NavigationMechanics().LOCATION_TYPE_STATION ||
					plrRecord['location_type'] != plrShip['location_type'] ||
					plrRecord['location_id'] != plrShip['location_id']
				) {
					output.messages.push("Can only switch ships while docked");
					callback(output);
					return;
				}
				
				PlayerShipsDAO().setActiveShip(dataBox, plrShip['plr_ship_id'], function(res) {
					callback(output);
				});
			});
		});
	};
	
	return module;
};
