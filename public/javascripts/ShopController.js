SolGame.ShopController = {
	renderDevClient : function(stationId) {
		// get data
		// form it into shape dev client needs
		// render
		SolGame.models.getShopsAtStation(stationId, function(defShops) {
			console.log(defShops);
			
			var objArr = [];
			
			defShops.defShops.forEach(function(defShop) {
				objArr.push({
					name: defShop.name,
					desc: '',
					onclick: `SolGame.ShopController.renderDcShopItems(${stationId}, ${defShop.shop_id});`
				});
			});
			
			SolGame.DevClient.renderObjects(`Shops at Station ${stationId}`, objArr);
		});
	},
	
	renderDcShopItems : function(stationId, shopId) {
		SolGame.models.getShopsAtStation(stationId, function(defShops) {
			var objArr = [];
			
			defShops.defShopItems.filter(e => e.shop_id == shopId).forEach(function(shopItem) {
				objArr.push({
					name: `Type: ${shopItem.output_item_type}, ID: ${shopItem.output_item_id}`,
					desc: `Type: ${shopItem.input_item_type}, ID: ${shopItem.input_item_id}`,
					onclick: `alert('clicked on ${shopItem.shop_item_id}');`
				});
			});
			
			SolGame.DevClient.renderObjects(`Shop Items at Shop ${shopId}`, objArr);
		});
	},
};
