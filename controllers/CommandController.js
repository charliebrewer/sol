var DataController = require('./DataController');
var DefinitionsController = require('./DefinitionsController');
var NavigationController = require('./NavigationController');
var PlayerController = require('./PlayerController');
var QuestController = require('./QuestController');
var ShopController = require('./ShopController');
var TempController = require('./TempController');

module.exports = function() {
	var module = {};
	
	module.commandCodes = {
		'100' : DataController().getAllClientData,
		'101' : DefinitionsController().getAllDefinitionsData,
		'110' : PlayerController().getAllPlayerData,
		'210' : ShopController().activateShopItem,
		'220' : QuestController().acceptQuest,
		'230' : QuestController().arriveAtStation,
		'310' : NavigationController().plotRoute
	};
	
	/**
	 * @param command Integer mapping to commandCode
	 * @param input Object containing data to be passed to the corresponding function
	 * @param output Object with response information
	 */
	module.runCommand = function(command, input, output, callback) {
		command = parseInt(command).toString();
		
		if(!module.commandCodes[command]) {
			// Invalid code
			output.messages.push("Command (" + command + ") is an invalid command code.");
			callback(output);
		} else if(undefined == input.plrId || undefined == input.timeMs || undefined == input.data) {
			output.messages.push("Input does not contain plrId, timeMs, or data.");
			callback(output);
		} else {
			module.commandCodes[command](input, output, callback);
		}
	};
	
	return module;
};
