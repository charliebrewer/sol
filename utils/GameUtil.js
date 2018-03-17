var PlayerUtil = require('./PlayerUtil');

module.exports = function() {
	var module = {};
	
	module.updateFunctions = [
		PlayerUtil().syncLocation
	];
	
	module.updateGameState = function(plrId, timeMs, callback) {
		if(0 == module.updateFunctions.length) {
			callback();
			return;
		}
		
		module.runUpdateFunction(plrId, timeMs, 0, callback);
	};
	
	module.runUpdateFunction = function(plrId, timeMs, ufIndex, callback) {
		if(module.updateFunctions.length == ufIndex) {
			callback();
		} else {
			module.updateFunctions[ufIndex](plrId, timeMs, function() {
				ufIndex++;
				module.runUpdateFunction(plrId, timeMs, ufIndex, callback);
			});
		}
	};
	
	return module;
};
