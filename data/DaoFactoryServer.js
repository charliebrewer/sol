const DataSources = require('./DataSources');

const DefCelBodiesDaoServer = require('./ServerDaos/DefCelBodiesDaoServer');
const DefStationsDaoServer = require('./ServerDaos/DefStationsDaoServer');
const PlayerDaoServer = require('./ServerDaos/PlayerDaoServer');

module.exports = function() {
	var module = {};
	
	module.sourceType = DataSources.SOURCE_SERVER;
	
	module.getDao = function(daoType) {
		switch(daoType) {
			case DataSources.DAO_PLAYER:
				return PlayerDaoServer();
			break;
			
			case DataSources.DAO_CEL_BODIES:
				return DefCelBodiesDaoServer();
			break;
			
			case DataSources.DAO_STATIONS:
				return DefStationsDaoServer();
			break;
		}
	};
	
	return module;
};
