var sprintf = require("sprintf-js").sprintf;
var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.FLAG_DISABLED = 1;
	module.FLAG_SELLABLE = 2;
	
	module.params = {
		tableName      : 'def_shop_items',
		keyName        : 'shop_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_MANY
	};
	
	module.getShopItems = function(dataBox, shopId, callback) {
		PersistentDataAccess().getData(dataBox, module.params, shopId, callback);
	};
	
	module.getShopItemsAtShops = function(dataBox, shopIds, callback) {
		var shopIdsStr = shopIds.join(', ');
		
		var dataKey = PersistentDataAccess().getDataKey(module.params.tableName, shopIdsStr);
		
		if(dataBox.hasData(dataKey)) {
			callback(dataBox.getData(dataKey));
			return;
		}
		
		var query = sprintf("SELECT * FROM %s WHERE shop_id IN (%s)", module.params.tableName, shopIdsStr);
		
		PersistentDataAccess().query(query, function(shopItems) {
			PersistentDataAccess().cacheData(dataBox, module.params, shopIdsStr, shopItems);
			
			callback(shopItems);
		});
	};
	
	return module;
};
