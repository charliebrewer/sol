var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.tableName = 'plr_routes';
	module.keyName   = 'plr_id';
	module.fields    = ['route_id', 'plr_id', 'plr_ship_id', 'destination_type', 'destination_id', 'min_x', 'max_x', 'min_y', 'max_y', 'time_end', 'route_data', 'flags'];
	
	module.getPlayerRoutes = function(plrId, callback) {
		PersistentDataAccess().selectMany(module.tableName, module.keyName, plrId, function(playerRoutes) {
			for(var i = 0; i < playerRoutes.length; i++) {
				playerRoutes[i]['route_data'] = JSON.parse(playerRoutes[i]['route_data']);
			}
			
			callback(playerRoutes);
		});
	};
	
	module.getPlayerRoute = function(routeId, callback) {
		PersistentDataAccess().selectOne(module.tableName, 'route_id', routeId, callback);
	};
	
	module.updatePlayerRoutes = function(playerRoute, callback) {
		playerRoute['route_data'] = JSON.stringify(playerRoute['route_data']);
		
		PersistentDataAccess().updateOne(module.tableName, module.keyName, module.fields, playerRoute, function(output) {
			callback(output);
		});
	}
	
	return module;
};
