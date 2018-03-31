var Logger = require('../helpers/Logger');

module.exports = function() {
	var module = {};
	
	module.getShopsAtStation = function(dataBox, stationId, callback) {
		DefShopsDAO().getShops(dataBox, function(defShops) {
			var defShopsAtStation = defShops.filter(e => e['station_id'] == stationId);
			
			if(0 == defShopsAtStation.length) {
				callback([], []);
				return;
			}
			
			var shopIds = [];
			defShopsAtStation.forEach(function(defShop) {
				shopIds.push(defShop['shop_id']);
			});
			
			DefShopItemsDAO().getShopItemsAtShops(dataBox, shopIds, function(defShopItems) {
				callback(defShopsAtStation, defShopItems);
			});
		});
	};
	
	return module;
};
