var sprintf = require("sprintf-js").sprintf;

var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.FLAG_SOLD = 1;
	
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
			});
			
			callback(plrShips);
		});
	};
	
	module.storePlayerShip = function(plrShip, callback) {
		plrShip['loadout'] = JSON.stringify(plrShip['loadout']);
		
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
