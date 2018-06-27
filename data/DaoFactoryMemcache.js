const DataSources = require('./DataSources');

const BaseDao = require('./BaseDao');

const PlayerDaoMemcache = require('./MemcacheDaos/PlayerDaoMemcache');

module.exports = function() {
	var module = {};
	
	module.sourceType = DataSources.SOURCE_MEMCACHE;
	
	module.getDao = function(daoType) {
		switch(daoType) {
			case DataSources.DAO_PLAYER:
				return PlayerDaoMemcache();
			break;
			
			default:
				return BaseDao();
			break;
		}
	};
	
	return module;
};
