// Main end point for making calls to the server
SolGame.models = {
	commandCodes : {
		COMMAND_GET_ALL_CLIENT_DATA      : {code : 100, useDataBox : true},
		COMMAND_GET_ALL_DEFINITIONS_DATA : {code : 101, useDataBox : true},
		COMMAND_GET_ALL_PLAYER_DATA      : {code : 110, useDataBox : true},
		COMMAND_GET_SHOPS_AT_STATION     : {code : 205, useDataBox : true},
		COMMAND_ACTIVATE_SHOP_ITEM       : {code : 210, useDataBox : false},
		COMMAND_ACCEPT_QUEST             : {code : 220, useDataBox : false},
		COMMAND_COMPLETE_QUEST           : {code : 230, useDataBox : false},
		COMMAND_PLOT_ROUTE               : {code : 310, useDataBox : false}
	},
	
	dataBox : null,
	
	init : function() {
		SolGame.models.dataBox = SolGame.Shared.DataBox().getBox(0,0);
	},
	
	/**
	 * Central function to interact with the server. Call callback with a single parameter, output.
	 */
	runCommand : function(command, input, callback) {
		var req = JSON.stringify({"command" : command.code, "data" : input});
		
		if(command.useDataBox && SolGame.models.dataBox.hasData(req)) {
			callback(SolGame.models.dataBox.getData(req));
			return;
		}
		
		$.post("runCommand", {"req" : req}, function(output) {
			// TODO do we want to handle success / failure and messages here, and not sending them to the callback?
			output.messages.forEach(function(m) {
				console.log(m);
			});
			
			if(command.useDataBox)
				SolGame.models.dataBox.setData(req, output.data);
			
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
		SolGame.models.runCommand(SolGame.models.commandCodes.COMMAND_GET_ALL_PLAYER_DATA, {}, callback);
	},
	
	getDefinitionsData : function(callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.COMMAND_GET_ALL_DEFINITIONS_DATA, {}, callback);
	},
	
	getShopsAtStation : function(sId, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.COMMAND_GET_SHOPS_AT_STATION, {stationId : sId}, callback);
	},
	
	// Update server functions
	
	acceptQuest : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.COMMAND_ACCEPT_QUEST, data, callback);
	},
	
	completeQuest : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.COMMAND_COMPLETE_QUEST, data, callback);
	},
	
	plotRoute : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.COMMAND_PLOT_ROUTE, data, callback);
	},
	
	activateShopItem : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.COMMAND_ACTIVATE_SHOP_ITEM, data, callback);
	}
};
