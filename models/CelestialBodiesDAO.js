var PersistentDataAccess = require('./PersistentDataAccess');

var OrbitalMechanics = require('../helpers/OrbitalMechanics');

module.exports = function() {
	var module = {};
	
	module.FLAG_DISABLED = 1;
	
	module.params = {
		tableName      : 'def_celestial_bodies',
		keyName        : 'celestial_body_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_ALL
	};
	
	module.getBodies = function(dataBox, callback) {
		PersistentDataAccess().getData(dataBox, module.params, 0, function(cBodies) {
			var returnBodies = [];
			
			cBodies.forEach(function(cBody) {
				if(0 == (module.FLAG_DISABLED & cBody['flags']))
					returnBodies.push(cBody);
			});
			
			OrbitalMechanics().populateOrbitalPeriods(returnBodies);
			
			callback(returnBodies);
		});
	};
	
	return module;
};
