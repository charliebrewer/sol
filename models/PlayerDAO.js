var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.tableName = 'plr_players';
	module.keyName   = 'plr_id';
	module.fields    = ['plr_id', 'acct_id', 'name', 'credits', 'location_type', 'location_id', 'flags'];
	
	module.params = {
		tableName      : 'plr_players',
		keyName        : 'plr_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_ONE
	};
	
	module.getPlayer = function(dataBox, plrId, callback) {
		PersistentDataAccess().getData(dataBox, module.params, plrId, callback);
	};
	
	module.updatePlayer = function(dataBox, playerRecord, callback) {
		PersistentDataAccess().setData(dataBox, module.params, playerRecord, callback);
	};
	
	module.modifyCredits = function(dataBox, creditDelta, callback) {
		PersistentDataAccess().updateByDelta(module.params.tableName, module.params.keyName, dataBox.getPlrId(), 'credits', creditDelta, callback);
	};
	
	return module;
};
