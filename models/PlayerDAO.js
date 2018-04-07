var sprintf = require("sprintf-js").sprintf;

var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	// The maximum restricted credits the player can claim per day
	module.R_CREDIT_MAX = 1500;
	
	module.params = {
		tableName      : 'plr_players',
		keyName        : 'plr_id',
		useDataBox     : true,
		cacheTimeoutSc : 0,
		setType        : PersistentDataAccess().SET_TYPE_ONE
	};
	
	module.getPlayer = function(dataBox, plrId, callback) {
		PersistentDataAccess().getData(dataBox, module.params, plrId, callback);
	};
	
	module.updatePlayer = function(dataBox, playerRecord, callback) {
		PersistentDataAccess().setData(dataBox, module.params, playerRecord, callback);
	};
	
	module.modifyCredits = function(dataBox, creditDelta, callback) {
		PersistentDataAccess().updateByDelta(module.params.tableName, module.params.keyName, dataBox.getPlrId(), 'credits', creditDelta, callback);
	};
	
	module.giveRestrictedCredits = function(dataBox, plrId, delta, callback) {
		var queryStr = sprintf(
			"UPDATE %s SET credits = credits + (LEAST(%i, %i + r_credits) - r_credits), rr_credits = rr_credits + GREATEST(0, ((%i + r_credits) - %i)), r_credits = LEAST(%i, %i + r_credits) WHERE %s = %i",
			module.params.tableName,
			module.R_CREDIT_MAX,
			delta,
			delta,
			module.R_CREDIT_MAX,
			module.R_CREDIT_MAX,
			delta,
			module.params.keyName,
			plrId
		);
		
		PersistentDataAccess().query(queryStr, function(res) {
			PersistentDataAccess().clearCache(dataBox, module.params, dataBox.getPlrId());
			
			callback(res);
		});
	};
	
	module.resetRestrictedCredits = function(dataBox, plrId, callback) {
		var queryStr = sprintf(
			"UPDATE %s SET credits = credits + LEAST(rr_credits, %i), r_credits = LEAST(rr_credits, %i), rr_credits = GREATEST(0, rr_credits - %i) WHERE %s = %i",
			module.params.tableName,
			module.R_CREDIT_MAX,
			module.R_CREDIT_MAX,
			module.R_CREDIT_MAX,
			module.params.keyName,
			plrId
		);
		
		PersistentDataAccess().query(queryStr, function(res) {
			PersistentDataAccess().clearCache(dataBox, module.params, dataBox.getPlrId());
			
			callback(res);
		});
	};
	
	return module;
};
