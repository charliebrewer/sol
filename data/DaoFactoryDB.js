const DataSources = require('./DataSources');

const BaseDao = require('./BaseDao');

const DefCelBodiesDaoDB = require('./DBDaos/DefCelBodiesDaoDB');
const PlayerDaoDB = require('./DBDaos/PlayerDaoDB');

module.exports = function() {
	var module = {};
	
	module.sourceType = DataSources.SOURCE_DB;
	
	module.getDao = function(daoType) {
		switch(daoType) {
			case DataSources.DAO_PLAYER:
				return PlayerDaoDB();
			break;
			
			case DataSources.DAO_CEL_BODIES:
				return DefCelBodiesDaoDB();
			break;
			
			default:
				return BaseDao();
			break;
		}
	};
	
	return module;
};
