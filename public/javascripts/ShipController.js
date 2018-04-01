SolGame.ShipController = function() {
	var module = {};
	
	module.modifyModules = function() {
		var input = {};
		
		input.sellModules = [];
		input.buyModules = [
			//{shopId : 3, shopItemId : 13, quantity : 1},
			//{shopId : 3, shopItemId : 8, quantity : 1}
		];
		input.shipLoadout = [3,7];
		
		SolGame.models.modifyModules(input, function() {});
	};
	
	return module;
};
