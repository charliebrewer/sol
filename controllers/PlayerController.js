var PlayerDAO = require('../models/PlayerDAO');
var PlayerRoutesDAO = require('../models/PlayerRoutesDAO');
var PlayerShipsDAO = require('../models/PlayerShipsDAO');

var NavigationMechanics = require('../helpers/NavigationMechanics');

module.exports = function() {
	var module = {};
	
	// Retrieve methods
	
	/**
	 * Retrieves all player data for a given player ID.
	 * 
	 * @return JSON object with player data.
	 */
	 module.getAllPlayerData = function(dataBox, input, output, callback) {
		PlayerDAO().getPlayer(dataBox, function(playerRecord) {
			output.data.playerRecord = playerRecord;
			
			PlayerRoutesDAO().getPlayerRoutes(dataBox.getPlrId(), function(playerRoutes) {
				var pr = [];
				
				for(let i = 0; i < playerRoutes.length; i++) {
					pr.push(NavigationMechanics().getRouteSml(
						playerRoutes[i]['route_id'],
						playerRoutes[i]['destination_type'],
						playerRoutes[i]['destination_id'],
						0, // TODO add ship ID
						playerRoutes[i]['route_data']
					));
				}
				
				output.data.playerRoutes = pr;
				
				PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
					output.data.playerShips = plrShips;
					
					callback(output);
				});
			});
		});
	};
	
	return module;
}
