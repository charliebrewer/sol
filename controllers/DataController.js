var DefinitionsController = require('./DefinitionsController');
var PlayerController = require('./PlayerController');

module.exports = function() {
	var module = {};
	
	/**
	 * Function to initialize the client when it first loads up. Includes player
	 * data and definitions data and anything else in one server call.
	 */
	module.getAllClientData = function(input, output, callback) {
		// Get all definitions data for the client
		output.data.definitionsData = {};
		output.data.playerData = {};
		
		DefinitionsController().getAllDefinitionsData(input, output, function(definitionsDataOutput) {
			output = definitionsDataOutput;

			PlayerController().getAllPlayerData(input, output, function(playerDataOutput) {
				output = playerDataOutput;
				
				callback(output);
			});
		});
	};
	
	return module;
};
