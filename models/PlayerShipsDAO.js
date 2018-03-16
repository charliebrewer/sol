var sprintf = require("sprintf-js").sprintf;

var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.tableName = 'plr_ships';
	module.keyName   = 'plr_id';
	module.fields    = [
		'plr_ship_id',
		'plr_id',
		'def_ship_id',
		'loadout',
		'cargo',
		'location_type',
		'location_id',
		'is_active',
		'flags'
	];
	
	module.getPlayerShips = function(plrId, callback) {
		PersistentDataAccess().selectMany(module.tableName, module.keyName, plrId, function(plrShips) {
			plrShips.forEach(function(ship) {
				ship['loadout'] = JSON.parse(ship['loadout']);
				ship['cargo'] = JSON.parse(ship['cargo']);
			});
			
			callback(plrShips);
		});
	};
	
	module.storePlayerShip = function(plrShip, callback) {
		plrShip['loadout'] = JSON.stringify(plrShip['loadout']);
		plrShip['cargo'] = JSON.stringify(plrShip['cargo']);
		
		PersistentDataAccess().updateOrInsert(module.tableName, plrShip, callback);
	};
	
	module.setActiveShip = function(plrId, activePlrShipId, callback) {
		var queryStr = sprintf(
			"UPDATE %s SET is_active = IF(plr_ship_id = %i, 1, 0) WHERE plr_id = %i",
			module.tableName,
			activePlrShipId,
			plrId
		);
		
		PersistentDataAccess().query(queryStr, callback);
	};
	
	return module;
};
