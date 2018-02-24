var PersistentDataAccess = require('./PersistentDataAccess');

var OrbitalMechanics = require('../helpers/OrbitalMechanics');

module.exports = function() {
	var module = {};
	
	module.tableName = 'def_stations';
	module.keyName   = 'station_id';
	module.fields    = ['station_id', 'name', 'img_url', 'parent_body_id', 'distance_from_parent', 'flags'];
	
	module.getStations = function(celestialBodies, callback) {
		PersistentDataAccess().selectAll(module.tableName, function(stations) {
			stations.forEach(function(station) {
				for(let i = 0; i < celestialBodies.length; i++) {
					if(celestialBodies[i]['celestial_body_id'] == station['parent_body_id']) {
						station['orbital_period_hours'] = OrbitalMechanics().getOrbitalPeriod(
							station['distance_from_parent'],
							celestialBodies[i]['mass'],
							OrbitalMechanics().EARTH_YEAR_PERIOD
						);
						
						break;
					}
				}
				
				if(undefined == station['orbital_period_hours']) {
					console.log('Could not populate orbital period hours for station ' + station['station_id']);
					station['orbital_period_hours'] = 1;
				}
			});
			
			callback(stations);
		});
	};
	
	return module;
};
