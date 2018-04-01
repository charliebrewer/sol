SolGame.ShipController = function() {
	var module = {};
	
	module.modifyModules = function() {
		var input = {};
		
		input.sellModules = [];
		input.buyModules = [
			//{shopId : 3, shopItemId : 13, quantity : 1}
		/*
			{shopId : 17, shopItemId : 288, quantity : 1},
			{shopId : 17, shopItemId : 228, quantity : 1},
			{shopId : 17, shopItemId : 277, quantity : 1}
		*/
		];
		input.shipLoadout = [1,7,3];
		
		SolGame.models.modifyModules(input, function() {});
	};
	
	return module;
};
