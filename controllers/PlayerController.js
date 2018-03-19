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
		PlayerDAO().getPlayer(dataBox.getPlrId(), function(playerRecord) {
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
	
	// Update methods
	
	/**
	 * Gives or takes credits from a player.
	 *
	 * @param allowDebt Allow the result of removing credits to cause the player to have a negative balance.
	 *
	 * Calls callback with the amount of credits added / removed from the player's account.
	 */
	module.modifyPlayerCredits = function(plrId, credits, allowDebt, callback) {
		credits = parseInt(credits);
		if(!credits) {
			callback(0);
			return;
		}
		
		PlayerDAO().getPlayer(plrId, function(playerRecord) {
			if(!allowDebt && 0 > playerRecord['credits'] + credits) {
				callback(0);
				return;
			}
			
			playerRecord['credits'] += credits;
			
			PlayerDAO().updatePlayer(playerRecord, function() {
				callback(credits);
			});
		});
	};

	return module;
}
