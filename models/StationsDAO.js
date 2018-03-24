var PersistentDataAccess = require('./PersistentDataAccess');

var OrbitalMechanics = require('../helpers/OrbitalMechanics');

module.exports = function() {
	var module = {};
	
	module.params = {
		tableName      : 'def_stations',
		keyName        : 'station_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_ALL
	};
	
	module.getStations = function(dataBox, celestialBodies, callback) {
		PersistentDataAccess().getData(dataBox, module.params, 0, function(stations) {
			stations.forEach(function(station) {
				for(let i = 0; i < celestialBodies.length; i++) {
					if(celestialBodies[i]['celestial_body_id'] == station['parent_body_id']) {
						station['orbital_period_hours'] = OrbitalMechanics().getOrbitalPeriod(
							station['distance_from_parent'],
							celestialBodies[i]['mass']
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
