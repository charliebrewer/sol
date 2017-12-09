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
		if(!commandCodes[command]) {
			// Invalid code
			output.messages.push("command (" + command + ") is an invalid command code");
			callback(output);
		} else {
			eval(commandCodes[command])(input, output, callback);
		}
	}
	
	return module;
};
