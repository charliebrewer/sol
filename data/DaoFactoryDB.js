const DataSources = require('./DataSources');

const BaseDao = require('./BaseDao');

const DefCelBodiesDaoDB = require('./DBDaos/DefCelBodiesDaoDB');
const DefStationsDaoDB = require('./DBDaos/DefStationsDaoDB');
const PlrShipDaoDB = require('./DBDaos/PlrShipDaoDB');
const PlayerDaoDB = require('./DBDaos/PlayerDaoDB');
const AnomalyDaoDB = require('./DBDaos/AnomalyDaoDB');

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
			
			case DataSources.DAO_STATIONS:
				return DefStationsDaoDB();
			break;
			
			case DataSources.DAO_PLR_SHIP:
				return PlrShipDaoDB();
			break;
			
			case DataSources.DAO_ANOMALY:
				return AnomalyDaoDB();
			break;
			
			default:
				return BaseDao();
			break;
		}
	};
	
	return module;
};
