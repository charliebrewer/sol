var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.tableName = 'plr_players';
	module.keyName   = 'plr_id';
	module.fields    = ['plr_id', 'acct_id', 'name', 'credits', 'location_type', 'location_id', 'flags'];
	
	module.getPlayer = function(plrId, callback) {
		PersistentDataAccess().selectMany(module.tableName, module.keyName, plrId, function(playerRecords) {
			var playerRecord = playerRecords.pop();
			
			if(undefined == playerRecord) {
				console.log('Could not find player ' + plrId);
				callback({});
			} else {
				callback(playerRecord);
			}
		});
	};
	
	module.updatePlayer = function(playerRecord, callback) {
		PersistentDataAccess().updateOne(module.tableName, module.keyName, module.fields, playerRecord, function(output) {
			callback(output);
		});
	};
	
	module.modifyCredits = function(dataBox, creditDelta, callback) {
		PersistentDataAccess().updateByDelta(module.tableName, module.keyName, dataBox.getPlrId(), 'credits', creditDelta, callback);
	};
	
	return module;
};
