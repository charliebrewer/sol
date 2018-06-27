const DataSources = require('./DataSources');

const DaoFactoryLocal = require('./DaoFactoryLocal');
const DaoFactoryMemcache = require('./DaoFactoryMemcache');
const DaoFactoryServer = require('./DaoFactoryServer');
const DaoFactoryDB = require('./DaoFactoryDB');

module.exports = function() {
	var module = {};
	
	/**
	 * Returns a dao factory of the associated source type.
	 */
	module.getDaoFactory = function(sourceType) {
		switch(sourceType) {
			case DataSources.SOURCE_LOCAL:
				return DaoFactoryLocal();
			break;
			
			case DataSources.SOURCE_MEMCACHE:
				return DaoFactoryMemcache();
			break;
			
			case DataSources.SOURCE_SERVER:
				return DaoFactoryServer();
			break;
			
			case DataSources.SOURCE_DB:
				return DaoFactoryDB();
			break;
		}
		
		throw "Unhandled factory type: " + sourceType;
	};
	
	return module;
};
