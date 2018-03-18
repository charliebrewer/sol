var CelestialBodiesDAO = require('../models/CelestialBodiesDAO');
var DefQuestsDAO = require('../models/DefQuestsDAO');
var StationsDAO = require('../models/StationsDAO');

module.exports = function() {
	var module = {};
	
	module.getAllDefinitionsData = function(dataBox, input, output, callback) {
		// Get all definitions data for the client
		output.data.celestialBodies = [];
		output.data.stations = [];
		
		CelestialBodiesDAO().getBodies(function(celestialBodies) {
			output.data.celestialBodies = celestialBodies;
			
			StationsDAO().getStations(celestialBodies, function(stations) {
				output.data.stations = stations;
				
				DefQuestsDAO().getQuests(function(defQuests) {
					output.data.defQuests = defQuests;
					
					callback(output);
				});
			});
		});
	}
	
	return module;
};
