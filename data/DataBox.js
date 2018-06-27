const DataSources = require('./DataSources');
const DaoFactoryFactory = require('./DaoFactoryFactory');

/**
 * DataBox facade for requesting data from an arbitrary number of sources.
 *
 * Sources are bitmasks of DataSources.SOURCE_* that inform the DataBox
 * where to request data and where to write data.
 *
 * Cache management is handled automatically when reading and writing data.
 * While it is not recommended, you can define custom methods in a
 * particular DAO and request that DAO through the DataBox to call the
 * functions on it. Be sure to flush cache if the functions change state.
 */
module.exports = function() {
	module.getDataBoxServerStandard = function() {
		return module.getDataBox(
			DataSources.SOURCE_LOCAL | DataSources.SOURCE_MEMCACHE | DataSources.SOURCE_DB,
			DataSources.SOURCE_DB,
			DataSources.SOURCE_LOCAL | DataSources.SOURCE_MEMCACHE
		);
	};
	
	module.getDataBoxServerNoWrite = function() {
		return module.getDataBox(
			DataSources.SOURCE_LOCAL | DataSources.SOURCE_MEMCACHE | DataSources.SOURCE_DB,
			DataSources.SOURCE_LOCAL,
			DataSources.SOURCE_NONE
		);
	};
	
	module.getDataBoxClientStandard = function() {
		return module.getDataBox(
			DataSources.SOURCE_LOCAL | DataSources.SOURCE_SERVER,
			DataSources.SOURCE_NONE,
			DataSources.SOURCE_LOCAL
		);
	};
	
	module.getDataBox = function(readSources, writeSources, cacheSources) {
		var dataBox = {};
		
		// DAO Factory bitmasks
		dataBox.readSources  = parseInt(readSources);
		dataBox.writeSources = parseInt(writeSources);
		dataBox.cacheSources = parseInt(cacheSources);
		if(isNaN(dataBox.readSources) || isNaN(dataBox.writeSources) || isNaN(dataBox.cacheSources))
			throw "Invalid DataBox sources";
		
		if(0 != (writeSources & DataSources.SOURCE_DB) && 0 == (cacheSources & DataSources.SOURCE_MEMCACHE))
			throw "Cannot create data box that writes to db and doesn't clear memcache";
		
		dataBox.getData = function(daoType, id, callback) {
			dataBox._getData(DataSources.SOURCE_NONE, daoType, id, callback);
		};
		
		dataBox.setData = function(daoType, id, data, callback) {
			dataBox._setData(DataSources.SOURCE_NONE, daoType, id, data, callback);
		};
		
		dataBox.addData = function(daoType, id, data, callback) {
			dataBox._addData(DataSources.SOURCE_NONE, daoType, id, data, callback);
		};
		
		dataBox.delData = function(daoType, id, callback) {
			dataBox._delData(DataSources.SOURCE_NONE, daoType, id, data, callback);
		};
		
		dataBox.clearCache = function(daoType, id, callback) {
			dataBox._clearCache(DataSources.SOURCE_NONE, daoType, id, callback);
		};
		
		dataBox._daos = {
			_daos : {},
			
			getDao : function(sourceType, daoType) {
				return this._daos[this.getKey(sourceType, daoType)];
			},
			
			setDao : function(sourceType, daoType, dao) {
				this._daos[this.getKey(sourceType, daoType)] = dao;
			},
			
			clrDao : function(sourceType, daoType) {
				delete this._daos[this.getKey(sourceType, daoType)];
			},
			
			getKey : function(sourceType, daoType) {
				return sourceType + '_' + daoType;
			}
		};
		
		/**
		 * Method to return a specific concrete dao. This function is exposed
		 * so that custom behavior can be added to a dao and referenced later.
		 */
		dataBox._getDao = function(sourceType, daoType) {
			if(0 == (sourceType & (dataBox.readSources | dataBox.writeSources | dataBox.cacheSources)))
				throw "Cannot retrieve dao not associated with this DataBox";
			
			var dao = dataBox._daos.getDao(sourceType, daoType);
			
			if(undefined == dao) {
				dao = DaoFactoryFactory().getDaoFactory(sourceType).getDao(daoType);
				dataBox._daos.setDao(sourceType, daoType, dao);
			}
			
			return dao;
		};
		
		// sources, order of sources, function to call, set cache or clear cache
		
		dataBox._getData = function(prevSourceType, daoType, id, callback) {
			var sourceType = DataSources.nextSourceType(prevSourceType, dataBox.readSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				callback(null);
				return;
			}
			
			var dao = dataBox._getDao(sourceType, daoType);
			
			dao.getData(id, function(output) {
				if(null != output) {
					dataBox._cacheData(sourceType, daoType, id, output, function() {
						callback(output);
					});
					
					return;
				}
				
				dataBox._getData(sourceType, daoType, id, callback);
			});
		};
		
		dataBox._setData = function(prevSourceType, daoType, id, data, callback) {
			var sourceType = DataSources.nextSourceType(prevSourceType, dataBox.writeSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				dataBox.clearCache(daoType, id, callback);
				return;
			}
			
			var dao = dataBox._getDao(sourceType, daoType);
			
			dao.setData(id, data, function() {
				dataBox._setData(sourceType, daoType, id, data, callback);
			});
		};
		
		dataBox._addData = function(prevSourceType, daoType, id, data, callback) {
			var sourceType = DataSources.nextSourceType(prevSourceType, dataBox.writeSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				dataBox.clearCache(daoType, id, callback);
				return;
			}
			
			var dao = dataBox._getDao(sourceType, daoType);
			
			dao.addData(id, data, function() {
				dataBox._addData(sourceType, daoType, id, data, callback);
			});
		};
		
		dataBox._delData = function(prevSourceType, daoType, id, callback) {
			var sourceType = DataSources.nextSourceType(prevSourceType, dataBox.writeSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				dataBox.clearCache(daoType, id, callback);
				return;
			}
			
			var dao = dataBox._getDao(sourceType, daoType);
			
			dao.delData(id, function() {
				dataBox._delData(sourceType, daoType, id, callback);
			});
		};
		
		dataBox._cacheData = function(prevSourceType, daoType, id, data, callback) {
			var sourceType = DataSources.prevSourceType(prevSourceType, dataBox.cacheSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				callback(true);
				return;
			}
			
			var dao = dataBox._getDao(sourceType, daoType);
			
			dao.setData(id, data, function() {
				dataBox._cacheData(sourceType, daoType, id, data, callback);
			});
		};
		
		dataBox._clearCache = function(prevSourceType, daoType, id, callback) {
			var sourceType = DataSources.nextSourceType(prevSourceType, dataBox.cacheSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				callback(true);
				return;
			}
			
			var dao = dataBox._getDao(sourceType, daoType);
			
			dao.delData(id, function() {
				dataBox._clearCache(sourceType, daoType, id, callback);
			});
		};
		
		return dataBox;
	};

	return module;
};
