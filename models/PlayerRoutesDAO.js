var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.params = {
		tableName      : 'plr_routes',
		keyName        : 'plr_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_MANY
	};
	
	module.getPlayerRoutes = function(dataBox, plrId, callback) {
		PersistentDataAccess().getData(dataBox, module.params, plrId, callback);
	};
	
	module.getPlayerRoute = function(routeId, callback) {
		PersistentDataAccess().selectOne(module.tableName, 'route_id', routeId, callback);
	};
	
	module.updatePlayerRoutes = function(dataBox, plrRoute, callback) {
		plrRoute['route_data'] = JSON.stringify(plrRoute['route_data']);
		
		PersistentDataAccess().setData(dataBox, module.params, plrRoute, callback);
	}
	
	return module;
};
