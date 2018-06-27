const DataSources = require('./DataSources');

const PlayerDaoServer = require('./ServerDaos/PlayerDaoServer');

module.exports = function() {
	var module = {};
	
	module.sourceType = DataSources.SOURCE_SERVER;
	
	module.getDao = function(daoType) {
		switch(daoType) {
			case DataSources.DAO_PLAYER:
				return PlayerDaoServer();
			break;
		}
	};
	
	return module;
};
