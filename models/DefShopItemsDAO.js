var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.FLAG_DISABLED = 1;
	module.FLAG_SELLABLE = 2;
	
	module.tableName = 'def_shop_items';
	module.keyName   = 'shop_id';
	module.fields    = ['shop_item_id', 'shop_id', 'input_item_type', 'input_item_id', 'input_quantity', 'output_item_type', 'output_item_id', 'output_quantity', 'flags'];
	
	module.getShopItems = function(shopId, callback) {
		PersistentDataAccess().selectMany(module.tableName, module.keyName, shopId, function(shopItemsRecords) {
			callback(shopItemsRecords);
		});
	};
	
	return module;
};
