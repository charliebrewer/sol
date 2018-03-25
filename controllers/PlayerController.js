var PlayerDAO = require('../models/PlayerDAO');
var PlayerQuestsDAO = require('../models/PlayerQuestsDAO');
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
		PlayerDAO().getPlayer(dataBox, dataBox.getPlrId(), function(playerRecord) {
			output.data.playerRecord = playerRecord;
			
			PlayerRoutesDAO().getPlayerRoutes(dataBox, dataBox.getPlrId(), function(playerRoutes) {
				var pr = [];
				
				for(let i = 0; i < playerRoutes.length; i++) {
					pr.push(NavigationMechanics().getRouteSml(
						playerRoutes[i]['route_id'],
						playerRoutes[i]['destination_type'],
						playerRoutes[i]['destination_id'],
						0, // TODO add ship ID
						JSON.parse(playerRoutes[i]['route_data'])
					));
				}
				
				output.data.playerRoutes = pr;
				
				PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
					output.data.playerShips = plrShips;
					
					PlayerQuestsDAO().getPlayerQuests(dataBox, function(plrQuests) {
						output.data.playerQuests = plrQuests;
						
						callback(output);
					});
				});
			});
		});
	};
	
	return module;
}
