var sprintf = require("sprintf-js").sprintf;

var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.FLAG_SOLD = 1;
	
	module.params = {
		tableName      : 'plr_ships',
		keyName        : 'plr_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_MANY
	};
	
	module.getPlayerShips = function(dataBox, callback) {
		PersistentDataAccess().getData(dataBox, module.params, dataBox.getPlrId(), function(plrShips) {
			plrShips.forEach(function(ship) {
				ship['loadout'] = JSON.parse(ship['loadout']);
			});
			
			callback(plrShips);
		});
	};
	
	/**
	 * Get a new row to be stored in the db. This function is intended to be
	 * used in conjunction with storePlayerShip, as it will attempt to recycle
	 * old records.
	 */
	module.newRow = function(plrId, defShipId, plrShips = []) {
		var row = {};
		
		row.plr_id = plrId;
		row.def_ship_id = defShipId;
		
		row.loadout       = {};
		row.cargo         = '{}';
		row.location_type = 0; // It's magic... 0 = unknown location
		row.location_id   = 0;
		row.is_active     = 0;
		row.flags         = 0;
		
		// Recycle ships that have been sold
		var soldShip = plrShips.find(e => 0 != (e['flags'] & module.FLAG_SOLD));
		if(undefined != soldShip)
			row.plr_ship_id = soldShip.plr_ship_id;
		
		return row;
	};
	
	module.storePlayerShip = function(dataBox, plrShip, callback) {
		plrShip['loadout'] = JSON.stringify(plrShip['loadout']);
		
		PersistentDataAccess().setData(dataBox, module.params, plrShip, callback);
	};
	
	module.setActiveShip = function(dataBox, activePlrShipId, callback) {
		PersistentDataAccess().clearCache(dataBox, module.params, dataBox.getPlrId());
		
		var queryStr = sprintf(
			"UPDATE %s SET is_active = IF(plr_ship_id = %i, 1, 0) WHERE plr_id = %i",
			module.params.tableName,
			activePlrShipId,
			dataBox.getPlrId()
		);
		
		PersistentDataAccess().query(queryStr, callback);
	};
	
	return module;
};
