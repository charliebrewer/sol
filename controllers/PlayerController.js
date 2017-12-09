module.exports = function() {
	var module = {};
	
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

	return module;
}
