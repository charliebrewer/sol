const DataSources = require('./DataSources');

const PlayerDaoDB = require('./DBDaos/PlayerDaoDB');

module.exports = function() {
	var module = {};
	
	module.sourceType = DataSources.SOURCE_DB;
	
	module.getDao = function(daoType) {
		switch(daoType) {
			case DataSources.DAO_PLAYER:
				return PlayerDaoDB();
			break;
		}
	};
	
	return module;
};
