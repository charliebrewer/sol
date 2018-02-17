var PlayerDAO = require('../models/PlayerDAO');

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
				module.getPlayerRecord(plrId, function(playerRecord) {
					output.playerRecord = playerRecord;
					
					module.getPlayerRoutes(plrId, function(playerRoutes) {
						output.playerRoutes = playerRoutes;
						
						module.getPlayerItems(plrId, function(playerPossessions) {
							output.playerPossessions = playerPossessions;
							
							callback(output);
						});
					});
				});
			}
		}
	};
	
	module.getPlayerRecord = function(plrId, callback) {
		callback({});
	};

	module.getPlayerRoutes = function(plrId, callback) {
		callback({});
	};

	module.getPlayerItems = function(plrId, callback) {
		callback({});
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
	}

	return module;
}
