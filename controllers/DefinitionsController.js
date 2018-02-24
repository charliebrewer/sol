var CelestialBodiesDAO = require('../models/CelestialBodiesDAO');
var StationsDAO = require('../models/StationsDAO');

module.exports = function() {
	var module = {};
	
	module.getAllDefinitionsData = function(input, output, callback) {
		// Get all definitions data for the client
		output.data.celestialBodies = [];
		output.data.stations = [];
		
		CelestialBodiesDAO().getBodies(function(celestialBodies) {
			output.data.celestialBodies = celestialBodies;
			
			StationsDAO().getStations(celestialBodies, function(stations) {
				output.data.stations = stations;
				
				callback(output);
			});
		});
	}
	
	return module;
};
