var CelestialBodiesDAO = require('../models/CelestialBodiesDAO');
var DefCommoditiesDAO = require('../models/DefCommoditiesDAO');
var DefQuestsDAO = require('../models/DefQuestsDAO');
var StationsDAO = require('../models/StationsDAO');

module.exports = function() {
	var module = {};
	
	module.getAllDefinitionsData = function(dataBox, input, output, callback) {
		// Get all definitions data for the client
		output.data.celestialBodies = [];
		output.data.stations = [];
		
		CelestialBodiesDAO().getBodies(dataBox, function(celestialBodies) {
			output.data.celestialBodies = celestialBodies;
			
			StationsDAO().getStations(dataBox, celestialBodies, function(stations) {
				output.data.stations = stations;
				
				DefQuestsDAO().getQuests(dataBox, function(defQuests) {
					output.data.defQuests = defQuests;
					
					DefCommoditiesDAO().getCommodities(dataBox, function(defCommodities) {
						output.data.defCommodities = defCommodities;
						
						callback(output);
					});
				});
			});
		});
	}
	
	return module;
};
