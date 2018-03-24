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
	
	return module;
};
