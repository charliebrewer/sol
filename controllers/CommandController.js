var DataController = require('./DataController');
var DefinitionsController = require('./DefinitionsController');
var ShopController = require('./ShopController');
var TempController = require('./TempController');

module.exports = function() {
	var module = {};
	
	var commandCodes = {
		000 : "TempController().runTempFunction",
		100 : "DataController().getAllClientData",
		101 : "DefinitionsController().getAllDefinitionsData",
		110 : "PlayerController().getAllPlayerData",
		//200 : "", // regular give an item to a player, admin action only
		210 : "ShopController().activateShopItem",
		300 : "NavigationController().plotCourse"
	};
	
	/**
	 * @param command Integer mapping to commandCode
	 * @param input Object containing data to be passed to the corresponding function
	 * @param output Object with response information
	 */
	module.runCommand = function(command, input, output, callback) {
		if(!commandCodes[command]) {
			// Invalid code
			output.messages.push("Command (" + command + ") is an invalid command code.");
			callback(output);
		} else if(undefined == input.plrId || undefined == input.timeMs || undefined == input.data) {
			output.messages.push("Input does not contain plrId, timeMs, or data.");
			callback(output);
		} else {
			eval(commandCodes[command])(input, output, callback);
		}
	};
	
	return module;
};
