var DefinitionsController = require('./DefinitionsController');
var TempController = require('./TempController');

module.exports = function() {
	var module = {};
	
	var commandCodes = {
		000 : "TempController().runTempFunction",
		100 : "DefinitionsController().getAllDefinitionsData",
		110 : "PlayerController().getAllPlayerData",
		300 : "NavigationController().plotCourse"
	};
	
	/**
	 * @param command Integer mapping to commandCode
	 * @param input Object containing data to be passed to the corresponding function
	 * @param output Object with response information
	 */
	module.runCommand = function(command, input, output, callback) {
		//response.message = commandCodes[command];
		if(!commandCodes[command]) {
			// Invalid code
			output.message = "command (" + command + ") is an invalid command code";
		} else {
			eval(commandCodes[command])(input, output, callback);
		}
	}
	
	return module;
};
