var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.tableName = 'def_shop';
	module.keyName   = 'shop_id';
	module.fields    = ['shop_id', 'name', 'station_id', 'flags'];
	
	module.getShop = function(shopId, callback) {
		PersistentDataAccess().selectMany(module.tableName, module.keyName, shopId, function(shopRecords) {
			var shopDef = shopRecords.pop();
			
			if(undefined == shopDef) {
				console.log('Could not find shop ' + shopId);
				callback({});
			} else {
				callback(shopDef);
			}
		});
	};
	
	return module;
};
