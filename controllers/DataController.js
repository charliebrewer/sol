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
		
		DefinitionsController().getAllDefinitionsData(input, output, function(definitionsData) {
			output.data.definitionsData = definitionsData;
			
			PlayerController().getAllPlayerData(input, output, function(playerData) {
				output.data.playerData = playerData;
			});
		});
	};
	
	return module;
};
