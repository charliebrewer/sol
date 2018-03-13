var PlayerDAO = require('../models/PlayerDAO');
var PlayerRoutesDAO = require('../models/PlayerRoutesDAO');

var NavigationMechanics = require('../helpers/NavigationMechanics');

module.exports = function() {
	var module = {};
	
	// Retrieve methods
	
	/**
	 * Retrieves all player data for a given player ID.
	 * 
	 * @return JSON object with player data.
	 */
	 module.getAllPlayerData = function(input, output, callback) {
		if(null == input.plrId) {
			output.messages.push("No plrId in request");
			callback(output);
		} else {
			var plrId = parseInt(input.plrId);

			if(!plrId) {
				output.messages.push("Invalid plrId");
				callback(output);
			} else {
				PlayerDAO().getPlayer(plrId, function(playerRecord) {
					output.data.playerRecord = playerRecord;
					
					PlayerRoutesDAO().getPlayerRoutes(plrId, function(playerRoutes) {
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
						
						// etc
						
						callback(output);
					});
				});
			}
		}
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
