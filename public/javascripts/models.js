// Main end point for making calls to the server
SolGame.models = {
	commandCodes : {
		CMD_GET_ALL_CLIENT_DATA      : {code : 100, useCmdCache : true},
		CMD_GET_ALL_DEFINITIONS_DATA : {code : 101, useCmdCache : true},
		CMD_GET_ALL_PLAYER_DATA      : {code : 110, useCmdCache : true},
		CMD_GET_SHOPS_AT_STATION     : {code : 205, useCmdCache : true},
		CMD_ACTIVATE_SHOP_ITEM       : {code : 210, useCmdCache : false},
		CMD_GET_QUESTS               : {code : 215, useCmdCache : false},
		CMD_ACCEPT_QUEST             : {code : 220, useCmdCache : false},
		CMD_COMPLETE_QUEST           : {code : 230, useCmdCache : false},
		CMD_PLOT_ROUTE               : {code : 310, useCmdCache : false},
		CMD_SET_ACTIVE_SHIP          : {code : 350, useCmdCache : false},
		CMD_MODIFY_MODULES           : {code : 360, useCmdCache : false}
	},
	
	cmdCache : {
		cache : {},
		
		disable : false,
		
		getData : function(cmdCode, inputStr) {
			if(!this.hasData(cmdCode, inputStr))
				return {};
			
			return this.cache[cmdCode][inputStr];
		},
		
		setData : function(cmdCode, inputStr, data) {
			if(this.disable)
				return;
			
			if(undefined == this.cache[cmdCode])
				this.cache[cmdCode] = {};
			
			this.cache[cmdCode][inputStr] = data;
		},
		
		hasData : function(cmdCode, inputStr) {
			if(undefined == this.cache[cmdCode])
				return false;
			
			if(undefined == this.cache[cmdCode][inputStr])
				return false;
			
			return true;
		},
		
		clrData : function(cmdCode) {
			delete this.cache[cmdCode];
		},
		
		flush : function() {
			this.cache = {};
		},
	},
	
	init : function() {
	},
	
	/**
	 * Central function to interact with the server. Call callback with a single parameter, output.
	 */
	runCommand : function(command, input, callback) {
		var inputStr = JSON.stringify(input);
		
		if(command.useCmdCache && this.cmdCache.hasData(command.code, inputStr)) {
			callback(this.cmdCache.getData(command.code, inputStr));
			return;
		}
		
		var req = JSON.stringify({"command" : command.code, "data" : input});
		
		$.post("runCommand", {"req" : req}, function(output) {
			// TODO do we want to handle success / failure and messages here, and not sending them to the callback?
			output.messages.forEach(function(m) {
				console.log(m);
			});
			
			if(command.useCmdCache)
				SolGame.models.cmdCache.setData(command.code, inputStr, output.data);
			
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
		SolGame.models.runCommand(SolGame.models.commandCodes.CMD_GET_ALL_PLAYER_DATA, {}, callback);
	},
	
	getDefinitionsData : function(callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.CMD_GET_ALL_DEFINITIONS_DATA, {}, callback);
	},
	
	getDefStations : function(callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.CMD_GET_ALL_DEFINITIONS_DATA, {}, function(defData) {
			callback(defData.stations);
		});
	},
	
	getShopsAtStation : function(sId, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.CMD_GET_SHOPS_AT_STATION, {stationId : sId}, callback);
	},
	
	getQuests : function(callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.CMD_GET_QUESTS, {}, callback);
	},
	
	// Update server functions
	
	acceptQuest : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.CMD_ACCEPT_QUEST, data, callback);
	},
	
	completeQuest : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.CMD_COMPLETE_QUEST, data, callback);
	},
	
	plotRoute : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.CMD_PLOT_ROUTE, data, callback);
	},
	
	activateShopItem : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.CMD_ACTIVATE_SHOP_ITEM, data, function(output) {
			SolGame.models.cmdCache.clrData(SolGame.models.commandCodes.CMD_GET_ALL_PLAYER_DATA.code);
			callback(output);
		});
	},
	
	modifyModules : function(data, callback) {
		SolGame.models.runCommand(SolGame.models.commandCodes.CMD_MODIFY_MODULES, data, callback);
	}
};
