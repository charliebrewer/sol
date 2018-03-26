// Main end point for making calls to the server
SolGame.models = {
	COMMAND_GET_ALL_CLIENT_DATA : 100,
	COMMAND_GET_ALL_DEFINITIONS_DATA : 101,
	COMMAND_GET_ALL_PLAYER_DATA : 110,
	COMMAND_GET_SHOPS_AT_STATION : 205,
	COMMAND_ACTIVATE_SHOP_ITEM : 210,
	COMMAND_ACCEPT_QUEST : 220,
	COMMAND_COMPLETE_QUEST : 230,
	COMMAND_PLOT_ROUTE : 310,
	
	/**
	 * Central function to interact with the server. Call callback with a single parameter, output.
	 */
	runCommand : function(command, input, callback) {
		var req = JSON.stringify({"command" : command, "data" : input});
		
		$.post("runCommand", {"req" : req}, function(output) {
			// TODO do we want to handle success / failure and messages here, and not sending them to the callback?
			callback(output.data);
		});
	},
	
	// Data retreival functions
	
	getPlayerAndDefinitionData : function(callback) {
		// TODO
	},
	
	/**
	 * Function to retrieve information about the current player. Retreiving
	 * information about other players should not be attempted here.
	 */
	getPlayerData : function(callback) {
		SolGame.models.runCommand(SolGame.models.COMMAND_GET_ALL_PLAYER_DATA, {}, callback);
	},
	
	getDefinitionsData : function(callback) {
		SolGame.models.runCommand(SolGame.models.COMMAND_GET_ALL_DEFINITIONS_DATA, {}, callback);
	},
	
	getShopsAtStation : function(sId, callback) {
		SolGame.models.runCommand(SolGame.models.COMMAND_GET_SHOPS_AT_STATION, {stationId : sId}, callback);
	},
	
	// Update server functions
	
	acceptQuest : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.COMMAND_ACCEPT_QUEST, data, callback);
	},
	
	completeQuest : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.COMMAND_COMPLETE_QUEST, data, callback);
	},
	
	plotRoute : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.COMMAND_PLOT_ROUTE, data, callback);
	},
	
	activateShopItem : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.COMMAND_ACTIVATE_SHOP_ITEM, data, callback);
	}
};
