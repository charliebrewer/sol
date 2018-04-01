var DataController = require('./DataController');
var DefinitionsController = require('./DefinitionsController');
var NavigationController = require('./NavigationController');
var PlayerController = require('./PlayerController');
var QuestController = require('./QuestController');
var ShipController = require('./ShipController');
var ShopController = require('./ShopController');
var TempController = require('./TempController');

module.exports = function() {
	var module = {};
	
	module.commandCodes = {
		001 : TempController().runTempFunction,
		100 : DataController().getAllClientData,
		101 : DefinitionsController().getAllDefinitionsData,
		110 : PlayerController().getAllPlayerData,
		205 : ShopController().getShopsAtStation,
		210 : ShopController().activateShopItem,
		220 : QuestController().acceptQuest,
		230 : QuestController().completeQuest,
		310 : NavigationController().plotRoute,
		350 : ShipController().setActiveShip,
		360 : ShipController().modifyModules
	};
	
	/**
	 * @param command Integer mapping to commandCode
	 * @param input Object containing data to be passed to the corresponding function
	 * @param output Object with response information
	 */
	module.runCommand = function(dataBox, command, input, output, callback) {
		command = parseInt(command).toString();
		
		if(!module.commandCodes[command]) {
			// Invalid code
			output.messages.push("Command (" + command + ") is an invalid command code.");
			callback(output);
		} else {
			module.commandCodes[command](dataBox, input, output, callback);
		}
	};
	
	return module;
};
