var PlayerUtil = require('./PlayerUtil');

module.exports = function() {
	var module = {};
	
	module.updateFunctions = [
		PlayerUtil().syncLocation
	];
	
	module.updateGameState = function(dataBox, callback) {
		if(0 == module.updateFunctions.length) {
			callback();
			return;
		}
		
		module.runUpdateFunction(dataBox, 0, callback);
	};
	
	module.runUpdateFunction = function(dataBox, ufIndex, callback) {
		if(module.updateFunctions.length == ufIndex) {
			callback();
		} else {
			module.updateFunctions[ufIndex](dataBox, function() {
				ufIndex++;
				module.runUpdateFunction(dataBox, ufIndex, callback);
			});
		}
	};
	
	return module;
};
