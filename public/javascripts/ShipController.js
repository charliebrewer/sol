SolGame.ShipController = function() {
	var module = {};
	
	module.modifyModules = function() {
		var input = {};
		
		input.sellModules = [17, 5, 5];
		input.buyModules = [
			{shopId : 17, shopItemId : 288, quantity : 1},
			{shopId : 17, shopItemId : 228, quantity : 1},
			{shopId : 17, shopItemId : 277, quantity : 1}
		];
		input.shipLoadout = [1,5,4,4,0,8,123,99,228];
		
		SolGame.models.modifyModules(input, function() {});
	};
	
	return module;
};
