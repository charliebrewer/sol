var CelestialBodiesDAO = require('../models/CelestialBodiesDAO');

module.exports = function() {
	var module = {};
	
	module.getAllDefinitionsData = function(input, output, callback) {
		// Get all definitions data for the client
		output.data.celestialBodies = [];
		
		CelestialBodiesDAO().getBodies(function(celestialBodies) {
			output.data.celestialBodies = celestialBodies;
			
			// Call next DAO...
			
			callback(output);
		});
	}
	
	return module;
};
